'use client'

import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plug, RefreshCw, Unplug } from 'lucide-react'
import type { ProviderConnectionSummary, ProviderId } from '@/lib/provider-types'
import { providerConnectionsQueryKey, useProviderConnections } from './use-provider-connections'
import styles from './ai-composer.module.css'

const providers: Array<{ id: ProviderId; label: string; needsBaseUrl: boolean; needsModelId: boolean; hint: string }> = [
  { id: 'openai', label: 'OpenAI', needsBaseUrl: false, needsModelId: false, hint: 'API key validated against live /v1/models.' },
  { id: 'anthropic-claude', label: 'Anthropic / Claude', needsBaseUrl: false, needsModelId: false, hint: 'API key validated against live /v1/models.' },
  { id: 'google-gemini', label: 'Google Gemini', needsBaseUrl: false, needsModelId: false, hint: 'Key is validated with Google, then stored encrypted.' },
  { id: 'meta-muse', label: 'Meta / Muse', needsBaseUrl: false, needsModelId: false, hint: 'Validated against live model discovery.' },
  { id: 'xai-grok', label: 'xAI / Grok', needsBaseUrl: false, needsModelId: false, hint: 'Validated against live model discovery.' },
  { id: 'deepseek', label: 'DeepSeek', needsBaseUrl: false, needsModelId: false, hint: 'Validated against live model discovery.' },
  { id: 'minimax', label: 'MiniMax', needsBaseUrl: false, needsModelId: false, hint: 'Validated against live model discovery.' },
  { id: 'alibaba-qwen', label: 'Alibaba / Qwen', needsBaseUrl: true, needsModelId: true, hint: 'Enter compatible Base URL and Model ID; validated with a real generation probe.' },
  { id: 'zai-glm', label: 'Z.ai / GLM', needsBaseUrl: false, needsModelId: true, hint: 'Enter Model ID; validated with a real generation probe.' },
  { id: 'xiaomi-mimo', label: 'Xiaomi / MiMo', needsBaseUrl: false, needsModelId: true, hint: 'HTTP contract unverified; Model ID is validated live before use.' },
  { id: 'moonshot-kimi', label: 'Moonshot AI / Kimi', needsBaseUrl: false, needsModelId: true, hint: 'Enter Model ID; validated with a real generation probe.' },
  { id: 'openai-compatible', label: 'OpenAI-Compatible', needsBaseUrl: true, needsModelId: false, hint: 'Base URL + API Key. Uses /v1/chat/completions (plural). Optional Model ID for manual validation.' },
]

function messageFor(code: string) {
  if (code === 'INVALID_CREDENTIAL') return 'Provider rejected this credential. Check it and retry.'
  if (code === 'PROVIDER_RATE_LIMITED') return 'Too many attempts. Wait before retrying.'
  if (code === 'PROVIDER_TIMEOUT') return 'Provider did not respond in time. Retry when ready.'
  if (code === 'MODEL_ID_REQUIRED' || code === 'PROVIDER_MODEL_ID_REQUIRED') return 'Enter a Model ID for this provider.'
  if (code === 'PROVIDER_BASE_URL_REQUIRED' || code === 'INVALID_PROVIDER_BASE_URL') return 'Enter a valid https Base URL without credentials or IP host.'
  if (code === 'NO_COMPATIBLE_MODELS') return 'No compatible chat models were returned.'
  if (code === 'MODEL_DISCOVERY_UNAVAILABLE') return 'Live discovery unavailable; enter a Model ID for manual validation.'
  return 'Connection failed. Retry without reusing exposed values.'
}

export function ProviderConnections({ selectedProvider, selectedModel, onSelect }: {
  selectedProvider: ProviderId | ''
  selectedModel: string
  onSelect: (provider: ProviderId | '', modelId: string) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useProviderConnections()
  const [openId, setOpenId] = useState<ProviderId | ''>('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const connections = new Map((query.data?.connections ?? []).map((c) => [c.provider, c]))

  async function connect(provider: ProviderId, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const apiKey = String(form.get('apiKey') ?? '')
    const baseUrl = String(form.get('baseUrl') ?? '').trim()
    const modelId = String(form.get('modelId') ?? '').trim()
    setPending(true)
    setError('')
    setNotice('Validating credential…')
    try {
      const res = await fetch('/api/providers/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          ...(baseUrl ? { baseUrl } : {}),
          ...(modelId ? { modelId } : {}),
        }),
        signal: AbortSignal.timeout(30_000),
      })
      const result = await res.json().catch(() => null) as { connection?: ProviderConnectionSummary; error?: string } | null
      if (!res.ok || !result?.connection) {
        if (res.status === 401) router.replace('/login')
        setNotice('')
        setError(messageFor(typeof result?.error === 'string' ? result.error : 'PROVIDER_UNAVAILABLE'))
        return
      }
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
      onSelect(provider, result.connection.models.find((m) => m.id === selectedModel)?.id ?? result.connection.models[0]?.id ?? '')
      setNotice(`${result.connection.models.length} model(s) ready.`)
      setOpenId('')
      ;(event.target as HTMLFormElement).reset()
    } catch {
      setNotice('')
      setError('Provider service unavailable. Retry.')
    } finally {
      setPending(false)
    }
  }

  async function sync(provider: ProviderId) {
    setPending(true)
    setError('')
    setNotice('Refreshing live models…')
    try {
      const res = await fetch(`/api/providers/${provider}/sync-models`, { method: 'POST', signal: AbortSignal.timeout(20_000) })
      const result = await res.json().catch(() => null) as { models?: unknown[]; error?: string } | null
      if (!res.ok || !Array.isArray(result?.models)) {
        if (res.status === 401) router.replace('/login')
        setNotice('')
        setError(messageFor(typeof result?.error === 'string' ? result.error : 'PROVIDER_UNAVAILABLE'))
        return
      }
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
      setNotice(`${result.models.length} live model(s).`)
    } catch {
      setNotice('')
      setError('Model refresh failed. Retry.')
    } finally {
      setPending(false)
    }
  }

  async function disconnect(provider: ProviderId) {
    setPending(true)
    setError('')
    try {
      const res = await fetch(`/api/providers/${provider}`, { method: 'DELETE', signal: AbortSignal.timeout(10_000) })
      if (!res.ok) {
        if (res.status === 401) router.replace('/login')
        setError('Disconnect failed. Retry.')
        return
      }
      if (selectedProvider === provider) onSelect('', '')
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
      setNotice('Disconnected; credential and cache removed.')
    } catch {
      setError('Service unavailable. Retry disconnect.')
    } finally {
      setPending(false)
    }
  }

  if (query.isLoading) return <p className={styles.providerMessage} role="status">Checking provider connections…</p>

  return (
    <div>
      <label className={styles.modelLabel} htmlFor="forme-provider">Provider</label>
      <select
        id="forme-provider"
        className={styles.modelSelect}
        value={selectedProvider}
        onChange={(e) => {
          const next = e.target.value as ProviderId | ''
          const models = next ? connections.get(next)?.models ?? [] : []
          onSelect(next, models.some((m) => m.id === selectedModel) ? selectedModel : models[0]?.id ?? '')
        }}
      >
        <option value="">Choose a connected provider…</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>{p.label}{connections.has(p.id) ? ' · connected' : ''}</option>
        ))}
      </select>

      {selectedProvider && connections.get(selectedProvider) ? (
        <>
          <label className={styles.modelLabel} htmlFor="forme-model">Model</label>
          <select id="forme-model" className={styles.modelSelect} value={selectedModel} onChange={(e) => onSelect(selectedProvider, e.target.value)}>
            <option value="">Choose a validated model…</option>
            {connections.get(selectedProvider)!.models.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName} · {m.status}</option>
            ))}
          </select>
          <div className={styles.providerActions}>
            <button type="button" onClick={() => sync(selectedProvider)} disabled={pending}><RefreshCw size={13} aria-hidden="true" />Refresh</button>
            <button type="button" onClick={() => disconnect(selectedProvider)} disabled={pending}><Unplug size={13} aria-hidden="true" />Disconnect</button>
          </div>
        </>
      ) : selectedProvider ? (
        <p className={styles.providerMessage} role="status">Connect {providers.find((p) => p.id === selectedProvider)?.label} below to enable its models.</p>
      ) : null}

      <div className={styles.providerActions} style={{ marginTop: 8 }}>
        <button type="button" onClick={() => setOpenId(openId ? '' : selectedProvider || 'openai-compatible')} disabled={pending}>
          <Plug size={13} aria-hidden="true" />{openId ? 'Close connect form' : 'Connect / Reconnect'}
        </button>
      </div>

      {openId ? (
        <form
          className={styles.connectForm}
          onSubmit={(e) => connect(openId, e)}
          aria-label={`Connect ${openId}`}
        >
          <label htmlFor={`key-${openId}`}>API key</label>
          <input id={`key-${openId}`} name="apiKey" type="password" autoComplete="off" spellCheck={false} required minLength={1} maxLength={8192} />
          {providers.find((p) => p.id === openId)?.needsBaseUrl ? (
            <>
              <label htmlFor={`base-${openId}`}>Base URL (https)</label>
              <input id={`base-${openId}`} name="baseUrl" type="url" inputMode="url" placeholder="https://host.example/v1" autoComplete="off" spellCheck={false} required />
            </>
          ) : null}
          {providers.find((p) => p.id === openId)?.needsModelId || openId === 'openai-compatible' ? (
            <>
              <label htmlFor={`model-${openId}`}>Model ID{openId === 'openai-compatible' ? ' (optional)' : ''}</label>
              <input id={`model-${openId}`} name="modelId" type="text" autoComplete="off" spellCheck={false} maxLength={256} required={providers.find((p) => p.id === openId)?.needsModelId} />
            </>
          ) : null}
          <button type="submit" disabled={pending}>{pending ? 'Connecting…' : 'Validate and connect'}</button>
          <small>{providers.find((p) => p.id === openId)?.hint} Key is sent only to FORME server, validated live, then stored encrypted.</small>
        </form>
      ) : null}

      <p className={styles.providerMessage} role="status">Ignix is Coming Soon and cannot be connected.</p>
      {query.isError && !error ? <p className={styles.providerError} role="alert">Provider settings unavailable. <button type="button" onClick={() => void query.refetch()}>Retry</button></p> : null}
      {error ? <p className={styles.providerError} role="alert">{error}</p> : null}
      {notice ? <p className={styles.providerMessage} role="status">{notice}</p> : null}
    </div>
  )
}
