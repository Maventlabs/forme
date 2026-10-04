'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Download, FileUp, Link2, Trash2 } from 'lucide-react'
import styles from './project-controls.module.css'

// Real project controls wired to the verified backend. Nothing here simulates
// success: every action reflects the actual API response.

type PresetSummary = { id: string; name: string; description: string }
type ShareSummary = {
  id: string
  tokenPrefix: string
  expiresAt: string | Date | null
  revokedAt: string | Date | null
  createdAt: string | Date | null
}
type AssetSummary = {
  id: string
  fileName: string
  mimeType: string
  byteSize: number
  status: 'pending' | 'ready' | 'failed'
}

const DESIGN_CONTEXT_PLACEHOLDER = [
  '# Design context',
  'font-family: Instrument Sans',
  'spacing unit: 8',
  'radius: 6',
  'density: comfortable',
].join('\n')

export function ProjectControls({ projectId, revision }: { projectId: string; revision: number }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [designDocument, setDesignDocument] = useState(DESIGN_CONTEXT_PLACEHOLDER)
  const [activePreset, setActivePreset] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const presetsQuery = useQuery({
    queryKey: ['project-presets', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/preset`)
      if (!response.ok) throw new Error(response.status === 401 ? 'UNAUTHORIZED' : 'PRESETS_UNAVAILABLE')
      return await response.json() as { presets?: PresetSummary[] }
    },
    staleTime: 300_000,
    retry: 0,
  })

  const sharesQuery = useQuery({
    queryKey: ['project-shares', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/shares`)
      if (!response.ok) throw new Error('SHARES_UNAVAILABLE')
      return await response.json() as { shares?: ShareSummary[] }
    },
    retry: 0,
  })

  const assetsQuery = useQuery({
    queryKey: ['project-assets', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/assets`)
      if (!response.ok) throw new Error('ASSETS_UNAVAILABLE')
      return await response.json() as { assets?: AssetSummary[] }
    },
    retry: 0,
  })

  useEffect(() => {
    if (presetsQuery.error instanceof Error && presetsQuery.error.message === 'UNAUTHORIZED') router.replace('/login')
  }, [presetsQuery.error, router])

  const refreshProject = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] })
    await queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] })
  }, [queryClient, projectId])

  const applyPreset = useMutation({
    mutationFn: async (presetId: string) => {
      const response = await fetch(`/api/projects/${projectId}/preset`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ presetId, expectedRevision: revision }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'PRESET_APPLY_FAILED')
      return presetId
    },
    onSuccess: (presetId) => {
      setActivePreset(presetId)
      setError('')
      setNotice('Preset applied. Semantic structure is unchanged.')
    },
    onError: (mutationError: Error) => {
      setNotice('')
      setError(mutationError.message === 'REVISION_CONFLICT'
        ? 'Canvas changed before the preset could be saved. Reload and retry.'
        : 'The preset could not be applied.')
    },
  })

  const applyDesignContext = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/design-context`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceType: 'paste', content: designDocument, expectedRevision: revision, apply: true }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : 'DESIGN_CONTEXT_FAILED')
    },
    onSuccess: () => {
      setError('')
      setNotice('DESIGN.md parsed and applied. Node structure is unchanged.')
    },
    onError: (mutationError: Error) => {
      setNotice('')
      setError(mutationError.message === 'DESIGN_CONTEXT_NO_RULES'
        ? 'No recognisable design tokens were found. Add lines like "spacing unit: 8".'
        : mutationError.message === 'REVISION_CONFLICT'
          ? 'Canvas changed before the design context could be saved. Reload and retry.'
          : 'The design context could not be applied.')
    },
  })

  const createShare = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/shares`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 7 }),
      })
      const result = await response.json().catch(() => null) as { share?: { token?: string }; error?: string } | null
      if (!response.ok || !result?.share?.token) throw new Error(typeof result?.error === 'string' ? result.error : 'SHARE_CREATE_FAILED')
      return result.share.token as string
    },
    onSuccess: async (token) => {
      const url = `${window.location.origin}/share/${token}`
      setShareUrl(url)
      setError('')
      setNotice('Read-only link created. It is shown once; keep it safe.')
      await refreshProject()
    },
    onError: (mutationError: Error) => {
      setNotice('')
      setError(mutationError.message === 'RATE_LIMITED' ? 'Too many share links were created. Try again later.' : 'The share link could not be created.')
    },
  })

  const revokeShare = useMutation({
    mutationFn: async (shareId: string) => {
      const response = await fetch(`/api/projects/${projectId}/shares/${shareId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('SHARE_REVOKE_FAILED')
    },
    onSuccess: async () => {
      setShareUrl('')
      setError('')
      setNotice('Share link revoked. The link no longer resolves.')
      await refreshProject()
    },
    onError: () => {
      setNotice('')
      setError('The share link could not be revoked.')
    },
  })

  const uploadAsset = useMutation({
    mutationFn: async (file: File) => {
      const prepareResponse = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, byteSize: file.size }),
      })
      const prepared = await prepareResponse.json().catch(() => null) as { upload?: { url?: string; headers?: Record<string, string> }; error?: string } | null
      if (!prepareResponse.ok || !prepared?.upload?.url) {
        throw new Error(typeof prepared?.error === 'string' ? prepared.error : 'ASSET_UPLOAD_FAILED')
      }

      const putResponse = await fetch(prepared.upload.url, {
        method: 'PUT',
        headers: { 'content-type': file.type, ...(prepared.upload.headers ?? {}) },
        body: file,
      })
      if (!putResponse.ok) throw new Error('ASSET_TRANSFER_FAILED')

      const assetId = (prepared as { asset?: { id?: string } }).asset?.id
      if (!assetId) throw new Error('ASSET_UPLOAD_FAILED')
      const completeResponse = await fetch(`/api/projects/${projectId}/assets/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const completed = await completeResponse.json().catch(() => null) as { error?: string } | null
      if (!completeResponse.ok) throw new Error(typeof completed?.error === 'string' ? completed.error : 'ASSET_CONFIRM_FAILED')
    },
    onSuccess: async () => {
      setError('')
      setNotice('Asset uploaded and confirmed in durable storage.')
      await refreshProject()
    },
    onError: async (mutationError: Error) => {
      setNotice('')
      setError(mutationError.message === 'STORAGE_UNAVAILABLE'
        ? 'Object storage is not configured yet, so the upload was not performed. Add S3 variables to enable it.'
        : mutationError.message === 'ASSET_TYPE_NOT_ALLOWED'
          ? 'That file type is not supported.'
          : 'The asset could not be uploaded.')
      await refreshProject()
    },
  })

  async function downloadExport(format: 'json' | 'svg') {
    setError('')
    setNotice(`Preparing ${format.toUpperCase()} export…`)
    try {
      const response = await fetch(`/api/projects/${projectId}/export?format=${format}`)
      if (!response.ok) throw new Error('EXPORT_FAILED')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `forme-project.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setNotice(`${format.toUpperCase()} export downloaded from the saved canvas.`)
    } catch {
      setNotice('')
      setError('The export could not be generated.')
    }
  }

  function submitDesignContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyDesignContext.mutate()
  }

  function submitAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('asset')
    if (file instanceof File && file.size > 0) uploadAsset.mutate(file)
    event.currentTarget.reset()
  }

  const pending = applyPreset.isPending || applyDesignContext.isPending || createShare.isPending || revokeShare.isPending || uploadAsset.isPending

  return (
    <div className={styles.controls}>
      <section className={styles.group} aria-labelledby="preset-group">
        <h3 id="preset-group">Presets</h3>
        <div className={styles.presetRow}>
          <select
            aria-label="Design preset"
            className={styles.select}
            value={activePreset}
            disabled={pending}
            onChange={(event) => {
              setActivePreset(event.target.value)
              if (event.target.value) applyPreset.mutate(event.target.value)
            }}
          >
            <option value="">Choose a preset…</option>
            {(presetsQuery.data?.presets ?? []).map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
        </div>
        <p className={styles.hint}>Presets change spacing and rhythm only. Your nodes keep their identity and order.</p>
      </section>

      <section className={styles.group} aria-labelledby="design-context-group">
        <h3 id="design-context-group">DESIGN.md</h3>
        <form onSubmit={submitDesignContext} className={styles.form}>
          <label className={styles.label} htmlFor="forme-design-context">Paste or write your design context</label>
          <textarea
            id="forme-design-context"
            className={styles.textarea}
            value={designDocument}
            maxLength={262_144}
            spellCheck={false}
            onChange={(event) => setDesignDocument(event.target.value)}
          />
          <button className={styles.button} type="submit" disabled={pending || designDocument.trim().length === 0}>
            <FileUp size={13} aria-hidden="true" />Parse and apply
          </button>
        </form>
        <p className={styles.hint}>Automatic generation is Coming Soon. Upload, paste and manual editing are real.</p>
      </section>

      <section className={styles.group} aria-labelledby="asset-group">
        <h3 id="asset-group">Assets</h3>
        <form onSubmit={submitAsset} className={styles.form}>
          <label className={styles.label} htmlFor="forme-asset-upload">Upload image or reference</label>
          <input id="forme-asset-upload" className={styles.file} name="asset" type="file" accept="image/png,image/jpeg,image/webp,image/gif,text/markdown,text/plain,application/json" disabled={pending} />
          <button className={styles.button} type="submit" disabled={pending}>
            <FileUp size={13} aria-hidden="true" />{uploadAsset.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        {(assetsQuery.data?.assets ?? []).length > 0 ? (
          <ul className={styles.list}>
            {assetsQuery.data!.assets!.map((asset) => (
              <li key={asset.id}>
                <span>{asset.fileName}</span>
                <em>{asset.status}</em>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Delete ${asset.fileName}`}
                  disabled={pending}
                  onClick={async () => {
                    const response = await fetch(`/api/assets/${asset.id}`, { method: 'DELETE' })
                    if (response.ok) {
                      setNotice('Asset deleted.')
                      await refreshProject()
                    } else {
                      setError('The asset could not be deleted.')
                    }
                  }}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>No assets yet. Missing artwork keeps its placeholder without blocking layout.</p>
        )}
      </section>

      <section className={styles.group} aria-labelledby="share-group">
        <h3 id="share-group">Share</h3>
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={() => createShare.mutate()} disabled={pending}>
            <Link2 size={13} aria-hidden="true" />{createShare.isPending ? 'Creating…' : 'Create read-only link'}
          </button>
          {shareUrl ? (
            <button
              className={styles.button}
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                setNotice('Link copied to clipboard.')
              }}
            >
              <Copy size={13} aria-hidden="true" />{copied ? 'Copied' : 'Copy link'}
            </button>
          ) : null}
        </div>
        {shareUrl ? <p className={styles.link}>{shareUrl}</p> : null}
        {(sharesQuery.data?.shares ?? []).length > 0 ? (
          <ul className={styles.list}>
            {sharesQuery.data!.shares!.map((share) => (
              <li key={share.id}>
                <span>{share.tokenPrefix}…</span>
                <em>{share.revokedAt ? 'revoked' : share.expiresAt ? 'active' : 'active'}</em>
                {!share.revokedAt ? (
                  <button className={styles.iconButton} type="button" aria-label={`Revoke share ${share.tokenPrefix}`} disabled={pending} onClick={() => revokeShare.mutate(share.id)}>
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>Only you can see this project until you create a link.</p>
        )}
      </section>

      <section className={styles.group} aria-labelledby="export-group">
        <h3 id="export-group">Export</h3>
        <div className={styles.actions}>
          <button className={styles.button} type="button" onClick={() => void downloadExport('json')}>
            <Download size={13} aria-hidden="true" />Design IR JSON
          </button>
          <button className={styles.button} type="button" onClick={() => void downloadExport('svg')}>
            <Download size={13} aria-hidden="true" />Wireframe SVG
          </button>
        </div>
        <p className={styles.hint}>Both artifacts are generated from the current saved canvas.</p>
      </section>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  )
}