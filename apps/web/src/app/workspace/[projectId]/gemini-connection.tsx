'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { RefreshCw, Unplug } from 'lucide-react'
import { SiGoogle } from '@icons-pack/react-simple-icons'
import type { ProviderConnectionSummary } from '@/lib/provider-types'
import { providerConnectionsQueryKey, useProviderConnections } from './use-provider-connections'
import styles from './ai-composer.module.css'

function errorMessage(code: string) {
  if (code === 'INVALID_CREDENTIAL') return 'Gemini rejected this key. Check it and retry.'
  if (code === 'PROVIDER_RATE_LIMITED') return 'Too many connection attempts. Wait before retrying.'
  if (code === 'PROVIDER_TIMEOUT') return 'Gemini did not respond in time. Retry when ready.'
  if (code === 'NO_COMPATIBLE_MODELS') return 'This key returned no models that support text generation.'
  return 'The provider connection could not be completed. Retry.'
}

export function GeminiConnection({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string
  onModelChange: (modelId: string) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const apiKeyInput = useRef<HTMLInputElement>(null)
  const providerQuery = useProviderConnections()
  const connection = providerQuery.data?.connections.find((item) => item.provider === 'google-gemini') ?? null
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (providerQuery.error instanceof Error && providerQuery.error.message === 'UNAUTHORIZED') router.replace('/login')
  }, [providerQuery.error, router])

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const apiKey = String(new FormData(event.currentTarget).get('apiKey') ?? '')
    setPending(true)
    setError('')
    setNotice('Validating key and discovering available models…')
    try {
      const response = await fetch('/api/providers/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'google-gemini', apiKey }),
        signal: AbortSignal.timeout(15_000),
      })
      const result = await response.json().catch(() => null) as { connection?: ProviderConnectionSummary; error?: string } | null
      if (!response.ok || !result?.connection) {
        if (response.status === 401) router.replace('/login')
        setNotice('')
        setError(errorMessage(typeof result?.error === 'string' ? result.error : 'PROVIDER_UNAVAILABLE'))
        return
      }
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
      setNotice(`${result.connection.models.length} live models available.`)
    } catch {
      setNotice('')
      setError('The provider service is unavailable. Check your connection and retry.')
    } finally {
      if (apiKeyInput.current) apiKeyInput.current.value = ''
      setPending(false)
    }
  }

  async function syncModels() {
    if (!connection) return
    setPending(true)
    setError('')
    setNotice('Refreshing live models…')
    try {
      const response = await fetch(`/api/providers/${connection.provider}/sync-models`, {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      })
      const result = await response.json().catch(() => null) as { models?: unknown[]; error?: string } | null
      if (!response.ok || !result?.models) {
        if (response.status === 401) router.replace('/login')
        setNotice('')
        setError(errorMessage(typeof result?.error === 'string' ? result.error : 'PROVIDER_UNAVAILABLE'))
        return
      }
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
      setNotice(`${result.models.length} live models available.`)
    } catch {
      setNotice('')
      setError('Gemini model discovery failed. Retry.')
    } finally {
      setPending(false)
    }
  }

  async function disconnect() {
    if (!connection) return
    setPending(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`/api/providers/${connection.provider}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) {
        if (response.status === 401) router.replace('/login')
        setError('Gemini could not be disconnected. Retry.')
        return
      }
      onModelChange('')
      await queryClient.invalidateQueries({ queryKey: providerConnectionsQueryKey })
    } catch {
      setError('The provider service is unavailable. Retry disconnecting.')
    } finally {
      setPending(false)
    }
  }

  const models = connection?.models ?? []
  const modelSelection = models.some((model) => model.id === selectedModel) ? selectedModel : ''

  return (
    <section className={styles.providerPanel} aria-labelledby="gemini-provider-title">
      <div className={styles.providerHeading}>
        <div><p>PROVIDER</p><h3 id="gemini-provider-title"><SiGoogle size={13} aria-hidden="true" />Google Gemini</h3></div>
        {connection && <span className={styles.connectedState}>Connected</span>}
      </div>

      {providerQuery.isLoading ? <p className={styles.providerMessage} role="status">Checking provider connection…</p> : connection ? (
        <>
          <label className={styles.modelLabel} htmlFor="forme-model">Model</label>
          <select id="forme-model" className={styles.modelSelect} value={modelSelection} onChange={(event) => onModelChange(event.target.value)}>
            <option value="">Choose a live model…</option>
            {models.map((model) => <option key={model.id} value={model.id}>{model.displayName}</option>)}
          </select>
          <div className={styles.providerActions}>
            <button type="button" onClick={syncModels} disabled={pending}><RefreshCw size={13} aria-hidden="true" />Refresh models</button>
            <button type="button" onClick={disconnect} disabled={pending}><Unplug size={13} aria-hidden="true" />Disconnect</button>
          </div>
        </>
      ) : (
        <form className={styles.connectForm} onSubmit={connect}>
          <label htmlFor="gemini-api-key">Gemini API key</label>
          <input ref={apiKeyInput} id="gemini-api-key" name="apiKey" type="password" autoComplete="off" spellCheck={false} required minLength={20} maxLength={8_192} />
          <button type="submit" disabled={pending}>{pending ? 'Connecting…' : 'Validate and connect'}</button>
          <small>Key is sent only to FORME’s server, validated with Google, then stored encrypted.</small>
        </form>
      )}
      {providerQuery.isError && !error && <p className={styles.providerError} role="alert">Provider settings could not be loaded. <button type="button" onClick={() => void providerQuery.refetch()}>Retry</button></p>}
      {error && <p className={styles.providerError} role="alert">{error}</p>}
      {notice && <p className={styles.providerMessage} role="status">{notice}</p>}
    </section>
  )
}
