'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp } from 'lucide-react'
import { parseCanvasDocument, type DesignNode } from '@forme/design-ir'
import type { SaveState } from './canvas-store'
import { ProviderConnections } from './provider-connections'
import { useProviderConnections } from './use-provider-connections'
import type { ProviderId } from '@/lib/provider-types'
import styles from './ai-composer.module.css'

const editableTypes = new Set(['heading', 'text', 'paragraph', 'button'])

export function AIComposer({
  projectId,
  selectedNode,
  revision,
  saveState,
  busy,
  compareMode,
  onApplied,
}: {
  projectId: string
  selectedNode: DesignNode | null
  revision: number
  saveState: SaveState
  busy: boolean
  compareMode: boolean
  onApplied: (canvas: ReturnType<typeof parseCanvasDocument>, revision: number, nodeId: string) => void
}) {
  const router = useRouter()
  const providerQuery = useProviderConnections()
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | ''>('')
  const [selectedModel, setSelectedModel] = useState('')
  const models = providerQuery.data?.connections.find((connection) => connection.provider === selectedProvider)?.models ?? []
  const [instruction, setInstruction] = useState('')
  const [pending, setPending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [generationUncertain, setGenerationUncertain] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState('')
  const canEditTarget = selectedNode !== null && editableTypes.has(selectedNode.type)
  const canSend = canEditTarget && selectedProvider !== '' && models.some((model) => model.id === selectedModel) && instruction.trim().length > 0
    && !busy && !compareMode && saveState === 'saved' && !pending && !generationUncertain
  const canCheckStatus = lastIdempotencyKey.length > 0
    && (status.startsWith('The edit is still running') || status.startsWith('We could not confirm'))

  async function sendInstruction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNode || !canSend) return

    const idempotencyKey = globalThis.crypto.randomUUID()
    setLastIdempotencyKey(idempotencyKey)
    setGenerationUncertain(false)
    setPending(true)
    setError('')
    setStatus(`Editing ${selectedNode.label}…`)
    try {
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          expectedRevision: revision,
          idempotencyKey,
          provider: selectedProvider,
          modelId: selectedModel,
          instruction: instruction.trim(),
        }),
        signal: AbortSignal.timeout(35_000),
      })
      const result = await response.json().catch(() => null) as {
        job?: { status?: string }
        project?: { canvas?: unknown; revision?: number }
        error?: string
      } | null
      if (!response.ok || !result?.project?.canvas || typeof result.project.revision !== 'number') {
        if (response.status === 401) router.replace('/login')
        if (response.status === 202) {
          setGenerationUncertain(true)
          setStatus('The edit is still running. Check its status before retrying.')
          return
        }
        const uncertain = result?.error === 'PROVIDER_TIMEOUT' || result?.error === 'PROVIDER_UNAVAILABLE'
        setGenerationUncertain(uncertain)
        setStatus(uncertain ? 'We could not confirm the result. Check its status before retrying.' : '')
        setError(result?.error === 'REVISION_CONFLICT'
          ? 'The canvas changed before this edit could save. Reload the latest canvas and retry.'
          : result?.error === 'PROVIDER_NOT_CONNECTED'
            ? 'Connect Gemini before sending an edit.'
            : result?.error === 'AI_TARGET_NODE_NOT_TEXT_EDITABLE'
              ? 'Select a heading, text, paragraph, or button to edit.'
          : result?.error === 'GENERATION_RATE_LIMITED'
            ? 'Generation limit reached. Wait before trying again.'
            : result?.error === 'MODEL_NOT_AVAILABLE'
              ? 'This model is no longer available. Refresh the live model list and choose another.'
              : result?.error === 'PROVIDER_MODEL_NOT_FOUND'
                ? 'Gemini no longer exposes this model. Refresh the live model list and choose another.'
              : result?.error === 'GENERATION_REQUEST_REJECTED'
                ? 'Gemini rejected this structured edit request. Refresh models or choose a different model.'
            : uncertain
              ? 'The provider response may still be resolving.'
          : 'The edit could not be completed. Retry with a new instruction.')
        return
      }

      onApplied(parseCanvasDocument(result.project.canvas), result.project.revision, selectedNode.id)
      setInstruction('')
      setStatus('Edit saved to the selected node.')
    } catch {
      setGenerationUncertain(true)
      setStatus('We could not confirm the result. Check its status before retrying.')
    } finally {
      setPending(false)
    }
  }

  async function checkGenerationStatus() {
    if (!lastIdempotencyKey) return
    setChecking(true)
    setError('')
    try {
      const response = await fetch(`/api/generation/${lastIdempotencyKey}`, { signal: AbortSignal.timeout(10_000) })
      const result = await response.json().catch(() => null) as {
        job?: { status?: string; nodeId?: string; errorCode?: string | null }
        error?: string
      } | null
      if (!response.ok || !result?.job) {
        if (response.status === 401) router.replace('/login')
        setError('Generation status could not be loaded. Refresh the project and check the canvas.')
        return
      }
      if (result.job.status === 'succeeded') {
        const projectResponse = await fetch(`/api/projects/${projectId}`, { signal: AbortSignal.timeout(10_000) })
        if (projectResponse.status === 401) router.replace('/login')
        const projectResult = await projectResponse.json().catch(() => null) as {
          project?: { canvas?: unknown; revision?: number }
        } | null
        if (projectResponse.ok && projectResult?.project?.canvas && typeof projectResult.project.revision === 'number' && result.job.nodeId) {
          onApplied(parseCanvasDocument(projectResult.project.canvas), projectResult.project.revision, result.job.nodeId)
          setGenerationUncertain(false)
          setStatus('Edit is saved and the canvas is up to date.')
          return
        }
      }
      if (result.job.status === 'failed') {
        setGenerationUncertain(false)
        setStatus(`Generation failed${result.job.errorCode ? ` (${result.job.errorCode})` : ''}. Revise the instruction and retry.`)
      } else {
        setGenerationUncertain(true)
        setStatus(`Generation status: ${result.job.status ?? 'unknown'}. Refresh the canvas before retrying.`)
      }
    } catch {
      setError('Generation status could not be loaded. Refresh the project and check the canvas.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className={styles.composer} aria-label="AI Composer">
      <div className={styles.providerPanel}>
        <div className={styles.providerHeading}>
          <div><p>PROVIDER</p><h3 id="forme-provider-title">Bring your own model</h3></div>
        </div>
        <ProviderConnections
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onSelect={(provider, modelId) => { setSelectedProvider(provider); setSelectedModel(modelId) }}
        />
      </div>
      <form className={styles.composerForm} onSubmit={sendInstruction}>
        <p className={styles.scope}>
          {canEditTarget ? `@node · ${selectedNode.label}` : 'Select a text-capable node to scope an edit.'}
        </p>
        <textarea
          aria-label="Instructions for the selected node"
          maxLength={1_000}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={canEditTarget ? 'Describe a change to this node…' : 'Select a heading, text, paragraph, or button…'}
          value={instruction}
        />
        <div className={styles.composerFooter}>
          <span className={styles.composerHint}>{saveState === 'saved' ? `Canvas · rev ${revision}` : 'Save canvas changes before generating'}</span>
          <button className={styles.sendButton} type="submit" aria-label="Send scoped edit" disabled={!canSend}>
            <ArrowUp size={15} aria-hidden="true" />
          </button>
        </div>
        {status && <p className={styles.generationStatus} role="status">{status}</p>}
        {error && <p className={styles.providerError} role="alert">{error}</p>}
        {canCheckStatus ? (
          <button className={styles.checkStatus} type="button" onClick={checkGenerationStatus} disabled={checking}>
            {checking ? 'Checking…' : 'Check generation status'}
          </button>
        ) : null}
      </form>
    </section>
  )
}
