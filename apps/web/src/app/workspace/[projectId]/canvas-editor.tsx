'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  CopyPlus,
  Eye,
  Frame,
  Hand,
  Layers3,
  MousePointer2,
  Redo2,
  RotateCcw,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type MouseEvent, type PointerEvent } from 'react'
import { blockCategories, blockDefinitions, type CanvasDocument, type DesignNode } from '@forme/design-ir'
import { LogoutButton } from './logout-button'
import { AIComposer } from './ai-composer'
import { CanvasProvider, useCanvasStore, useCanvasStoreApi } from './canvas-provider'
import { CanvasNodeView } from './canvas-node-view'
import type { CanvasOperation, NodeChanges, SaveState } from './canvas-store'
import shell from './workspace.module.css'
import styles from './canvas.module.css'

class CanvasMutationError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code)
  }
}

async function persistOperation(projectId: string, operation: CanvasOperation, revision: number) {
  let path: string
  let method: 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  let body: unknown

  if (operation.kind === 'create') {
    path = '/api/nodes'
    method = 'POST'
    body = {
      id: operation.node.id,
      projectId,
      expectedRevision: revision,
      blockId: operation.node.blockId,
      customBlockId: operation.node.customBlockId,
      parentId: operation.node.parentId,
      label: operation.node.label,
      props: operation.node.props,
      layouts: operation.node.layouts,
    }
  } else if (operation.kind === 'update') {
    path = `/api/nodes/${operation.nodeId}`
    method = 'PATCH'
    body = { projectId, expectedRevision: revision, changes: operation.changes }
  } else if (operation.kind === 'delete') {
    path = `/api/nodes/${operation.nodeId}`
    method = 'DELETE'
    body = { projectId, expectedRevision: revision }
  } else if (operation.kind === 'create-custom-block') {
    path = `/api/projects/${projectId}/blocks`
    method = 'POST'
    body = { id: operation.blockId, nodeId: operation.nodeId, name: operation.name, expectedRevision: revision }
  } else if (operation.kind === 'instantiate-custom-block') {
    path = `/api/projects/${projectId}/blocks/${operation.customBlockId}/instances`
    method = 'POST'
    body = { expectedRevision: revision, parentId: operation.parentId, idMap: operation.idMap }
  } else {
    path = `/api/projects/${projectId}/canvas`
    method = 'PUT'
    body = { expectedRevision: revision, canvas: operation.document }
  }

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new CanvasMutationError(0, 'NETWORK_ERROR')
  }

  const result = await response.json().catch(() => null) as { revision?: unknown; error?: unknown } | null
  if (!response.ok) {
    throw new CanvasMutationError(response.status, typeof result?.error === 'string' ? result.error : 'SAVE_FAILED')
  }
  if (typeof result?.revision !== 'number') throw new CanvasMutationError(500, 'INVALID_SAVE_RESPONSE')
  return result.revision
}

function saveStatusText(status: SaveState) {
  if (status === 'saving') return 'Saving…'
  if (status === 'dirty') return 'Changes pending'
  if (status === 'error') return 'Save failed'
  if (status === 'conflict') return 'Newer version exists'
  return 'Saved'
}

function dimensionValue(value: number | 'auto' | 'fill') {
  return typeof value === 'number' ? String(value) : value
}

function readDimension(value: string, fallback: number | 'auto' | 'fill') {
  if (value === 'auto' || value === 'fill') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10_000 ? parsed : fallback
}

function flattenedNodes(document: CanvasDocument) {
  const result: Array<{ node: DesignNode; depth: number }> = []
  const visit = (id: string, depth: number) => {
    const node = document.nodes[id]
    if (!node) return
    result.push({ node, depth })
    node.children.forEach((childId) => visit(childId, depth + 1))
  }
  document.rootIds.forEach((id) => visit(id, 0))
  return result
}

function NodeInspectorForm({
  node,
  breakpoint,
  busy,
  onApply,
  onVisibility,
  onDuplicate,
  onDelete,
  onSaveAsBlock,
}: {
  node: DesignNode
  breakpoint: 'desktop' | 'tablet' | 'mobile'
  busy: boolean
  onApply: (changes: NodeChanges) => void
  onVisibility: (breakpoint: 'desktop' | 'tablet' | 'mobile', visible: boolean) => void
  onDuplicate: () => void
  onDelete: () => void
  onSaveAsBlock: (name: string) => void
}) {
  const layout = node.layouts[breakpoint] ?? node.layouts.desktop
  const [labelDraft, setLabelDraft] = useState(node.label)
  const [textDraft, setTextDraft] = useState(String(node.props.text ?? ''))
  const [xDraft, setXDraft] = useState(String(layout.x))
  const [yDraft, setYDraft] = useState(String(layout.y))
  const [widthDraft, setWidthDraft] = useState(dimensionValue(layout.width))
  const [heightDraft, setHeightDraft] = useState(dimensionValue(layout.height))
  const [customName, setCustomName] = useState(`${node.label} block`)

  function applyInspector(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const currentLayout = node.layouts[breakpoint] ?? node.layouts.desktop
    const layouts = {
      ...node.layouts,
      [breakpoint]: {
        ...currentLayout,
        x: Number.isFinite(Number(xDraft)) ? Number(xDraft) : currentLayout.x,
        y: Number.isFinite(Number(yDraft)) ? Number(yDraft) : currentLayout.y,
        width: readDimension(widthDraft, currentLayout.width),
        height: readDimension(heightDraft, currentLayout.height),
      },
    }
    onApply({ label: labelDraft, props: { ...node.props, text: textDraft }, layouts })
  }

  return (
    <>
      <form className={styles.inspectorForm} onSubmit={applyInspector}>
        <label>Semantic label<input maxLength={120} onChange={(event) => setLabelDraft(event.target.value)} value={labelDraft} /></label>
        <label>Content<input maxLength={2_000} onChange={(event) => setTextDraft(event.target.value)} value={textDraft} /></label>
        <div className={styles.measureGrid}>
          <label>X <input inputMode="numeric" onChange={(event) => setXDraft(event.target.value)} value={xDraft} /></label>
          <label>Y <input inputMode="numeric" onChange={(event) => setYDraft(event.target.value)} value={yDraft} /></label>
          <label>Width <input onChange={(event) => setWidthDraft(event.target.value)} value={widthDraft} /></label>
          <label>Height <input onChange={(event) => setHeightDraft(event.target.value)} value={heightDraft} /></label>
        </div>
        <fieldset className={styles.visibility}>
          <legend>Visibility</legend>
          {(['desktop', 'tablet', 'mobile'] as const).map((item) => <label key={item}><input checked={node.visible && node.visibilityByBreakpoint[item]} onChange={(event) => onVisibility(item, event.target.checked)} type="checkbox" />{item}</label>)}
        </fieldset>
        <button className={styles.applyButton} disabled={busy} type="submit">Apply changes</button>
      </form>
      <div className={styles.nodeActions}>
        <button disabled={busy} onClick={onDuplicate} type="button"><CopyPlus size={14} aria-hidden="true" />Duplicate</button>
        <button disabled={busy} onClick={onDelete} type="button"><Trash2 size={14} aria-hidden="true" />Delete</button>
      </div>
      <form className={styles.customBlockForm} onSubmit={(event) => { event.preventDefault(); onSaveAsBlock(customName) }}>
        <label>Reusable block<input maxLength={80} minLength={1} onChange={(event) => setCustomName(event.target.value)} value={customName} /></label>
        <button disabled={busy || !customName.trim()} type="submit">Save as block</button>
      </form>
    </>
  )
}

function CanvasFrameView({
  document,
  breakpoint,
  comparison,
  onFrameClick,
  onFrameDrop,
}: {
  document: CanvasDocument
  breakpoint: 'desktop' | 'tablet' | 'mobile'
  comparison?: boolean
  onFrameClick: (event: MouseEvent<HTMLDivElement>, breakpoint: 'desktop' | 'tablet' | 'mobile') => void
  onFrameDrop: (event: DragEvent<HTMLDivElement>, breakpoint: 'desktop' | 'tablet' | 'mobile') => void
}) {
  const width = document.breakpoints[breakpoint].width
  return (
    <div
      className={`${styles.frame} ${comparison ? styles.comparisonFrame : ''}`}
      data-canvas-frame={breakpoint}
      onClick={(event) => onFrameClick(event, breakpoint)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onFrameDrop(event, breakpoint)}
      style={{ width }}
    >
      <header className={styles.frameHeader}><span>{breakpoint[0]!.toUpperCase() + breakpoint.slice(1)} · Home</span><span className={styles.measure}>{width} × auto</span></header>
      <div className={styles.frameContent}>
          {document.rootIds.length ? document.rootIds.map((nodeId) => <CanvasNodeView key={nodeId} nodeId={nodeId} breakpointOverride={breakpoint} readOnly={comparison} />) : (
          <div className={styles.emptyCanvas}>
            <p>Blank canvas</p>
            <span>Choose Text or drag a block here to begin.</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CanvasEditor(props: {
  projectId: string
  projectName: string
  name: string
  email: string
  canvas: CanvasDocument
  revision: number
}) {
  return (
    <CanvasProvider key={props.projectId} initialDocument={props.canvas} initialRevision={props.revision}>
      <CanvasWorkspace {...props} />
    </CanvasProvider>
  )
}

function CanvasWorkspace({ projectId, projectName, name, email }: Omit<Parameters<typeof CanvasEditor>[0], 'canvas' | 'revision'>) {
  const store = useCanvasStoreApi()
  const document = useCanvasStore((state) => state.document)
  const customBlocks = useCanvasStore((state) => state.document.customBlocks)
  const revision = useCanvasStore((state) => state.revision)
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeIds[0] ?? null)
  const selectedNode = useCanvasStore((state) => state.selectedNodeIds[0] ? state.document.nodes[state.selectedNodeIds[0]] ?? null : null)
  const operations = useCanvasStore((state) => state.operations)
  const saveState = useCanvasStore((state) => state.saveState)
  const saveError = useCanvasStore((state) => state.saveError)
  const activeTool = useCanvasStore((state) => state.activeTool)
  const activeBreakpoint = useCanvasStore((state) => state.activeBreakpoint)
  const viewport = useCanvasStore((state) => state.viewport)
  const pastCount = useCanvasStore((state) => state.past.length)
  const futureCount = useCanvasStore((state) => state.future.length)
  const mutation = useMutation({
    mutationFn: ({ operation, expectedRevision }: { operation: CanvasOperation; expectedRevision: number }) =>
      persistOperation(projectId, operation, expectedRevision),
    onMutate: ({ operation }) => store.getState().markSaving(operation.id),
    onSuccess: (nextRevision, { operation }) => store.getState().completeOperation(operation.id, nextRevision),
    onError: (error, { operation }) => {
      const conflict = error instanceof CanvasMutationError && error.status === 409
      store.getState().failOperation(
        operation.id,
        conflict ? 'conflict' : 'error',
        conflict ? 'Another save reached the server first.' : 'The edit could not be saved.',
      )
    },
  })
  const nextOperation = operations[0]
  const viewportRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const activeFrameWidth = document.breakpoints[activeBreakpoint].width
  const worldWidth = compareMode ? document.breakpoints.desktop.width + document.breakpoints.mobile.width + 64 : activeFrameWidth
  const { mutate: mutateOperation, isPending: mutationIsPending } = mutation
  useEffect(() => {
    if (!nextOperation || mutationIsPending || saveState !== 'dirty') return
    mutateOperation({ operation: nextOperation, expectedRevision: revision })
  }, [mutationIsPending, mutateOperation, nextOperation, revision, saveState])

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const fit = () => {
      const zoom = Math.max(0.25, Math.min(0.72, (element.clientWidth - 80) / worldWidth))
      store.getState().setViewport({ x: 0, y: 0, zoom })
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    return () => observer.disconnect()
  }, [store, worldWidth])

  const refreshCanvas = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, { signal: AbortSignal.timeout(10_000) })
      if (!response.ok) throw new Error('RELOAD_FAILED')
      const result = await response.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
      if (!result.project?.canvas || typeof result.project.revision !== 'number') throw new Error('INVALID_PROJECT_RESPONSE')
      store.getState().resetFromServer(result.project.canvas, result.project.revision)
    } catch {
      const pending = store.getState().operations[0]
      if (pending) store.getState().failOperation(pending.id, 'error', 'Reload failed. Retry from the project list.')
    }
  }, [projectId, store])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target
      const editing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (editing) return
      const command = event.metaKey || event.ctrlKey
      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) store.getState().redo()
        else store.getState().undo()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        const selected = store.getState().selectedNodeIds[0]
        if (selected) {
          event.preventDefault()
          store.getState().deleteNode(selected)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [store])

  function framePoint(clientX: number, clientY: number, breakpoint: 'desktop' | 'tablet' | 'mobile') {
    const frame = viewportRef.current?.querySelector<HTMLElement>(`[data-canvas-frame="${breakpoint}"]`)
    if (!frame) return { x: 0, y: 0 }
    const rect = frame.getBoundingClientRect()
    return {
      x: Math.max(0, Math.round((clientX - rect.left) / viewport.zoom)),
      y: Math.max(0, Math.round((clientY - rect.top) / viewport.zoom)),
    }
  }

  function onFrameClick(event: MouseEvent<HTMLDivElement>, breakpoint: 'desktop' | 'tablet' | 'mobile') {
    if (compareMode || activeTool !== 'text' || (event.target as HTMLElement).closest('[data-node-id]')) return
    store.getState().setBreakpoint(breakpoint)
    store.getState().addBlock('text', framePoint(event.clientX, event.clientY, breakpoint), null, breakpoint)
  }

  function onDrop(event: DragEvent<HTMLDivElement>, breakpoint: 'desktop' | 'tablet' | 'mobile') {
    event.preventDefault()
    if (compareMode) return
    const nodeId = event.dataTransfer.getData('application/x-forme-node')
    const position = framePoint(event.clientX, event.clientY, breakpoint)
    if (nodeId && document.nodes[nodeId]) {
      const node = document.nodes[nodeId]
      const layout = node.layouts[breakpoint] ?? node.layouts.desktop
      store.getState().setBreakpoint(breakpoint)
      store.getState().editNode(nodeId, {
        layouts: { ...node.layouts, [breakpoint]: { ...layout, mode: 'absolute', x: position.x, y: position.y } },
      })
      return
    }

    const blockId = event.dataTransfer.getData('application/x-forme-block')
    if (blockId && blockDefinitions.some((block) => block.id === blockId)) {
      store.getState().setBreakpoint(breakpoint)
      store.getState().addBlock(blockId as (typeof blockDefinitions)[number]['id'], position, null, breakpoint)
    }
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    const canPan = event.nativeEvent.altKey || target.dataset.canvasBackground === 'true'
    if (!canPan || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y }
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId) return
    store.getState().setViewport({ ...viewport, x: pan.originX + event.clientX - pan.startX, y: pan.originY + event.clientY - pan.startY })
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null
  }

  function onWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const direction = event.deltaY < 0 ? 0.05 : -0.05
    store.getState().setViewport({ ...viewport, zoom: Math.max(0.25, Math.min(1.25, viewport.zoom + direction)) })
  }

  const layers = useMemo(() => flattenedNodes(document), [document])
  const retry = () => store.getState().retrySave()
  const applyAIEdit = (canvas: CanvasDocument, nextRevision: number, nodeId: string) => {
    store.getState().resetFromServer(canvas, nextRevision)
    store.getState().selectNode(nodeId)
  }

  return (
    <main className={shell.workspace}>
      <nav className={shell.rail} aria-label="Workspace navigation">
        <Link className={shell.mark} href="/projects" aria-label="Back to projects"><Image src="/brand/forme/forme-logo-mark-white.png" alt="" width={24} height={22} priority /></Link>
        <Link className={`${shell.railItem} ${shell.active}`} href="/projects"><Layers3 size={16} aria-hidden="true" /><span>Canvas</span></Link>
        <div className={shell.railDivider} />
        {[
          { label: 'File', icon: Box },
          { label: 'Agents', icon: Type },
          { label: 'Assets', icon: Frame },
          { label: 'Tools', icon: MousePointer2 },
          { label: 'Variables', icon: Eye },
        ].map(({ label, icon: Icon }) => <div className={shell.railItem} key={label} title={`${label} tools arrive in a later phase`}><Icon size={16} aria-hidden="true" /><span>{label}</span><small>Next</small></div>)}
      </nav>

      <section className={shell.center} aria-label={`${projectName} canvas editor`}>
        <header className={shell.topbar}>
          <div className={shell.breadcrumb}><Link href="/projects">Projects</Link><span aria-hidden="true">/</span><h1>{projectName}</h1></div>
          <div className={styles.topControls}>
            <div className={styles.breakpointControls} role="group" aria-label="Responsive frame">
              {(['desktop', 'tablet', 'mobile'] as const).map((breakpoint) => <button key={breakpoint} type="button" aria-pressed={activeBreakpoint === breakpoint && !compareMode} onClick={() => { setCompareMode(false); store.getState().setBreakpoint(breakpoint) }}><span>{breakpoint[0]!.toUpperCase() + breakpoint.slice(1)}</span><small>{document.breakpoints[breakpoint].width}px</small></button>)}
              <button className={styles.compareButton} type="button" aria-pressed={compareMode} onClick={() => { store.getState().setActiveTool('select'); setCompareMode((current) => !current) }}>Compare</button>
            </div>
            <div className={styles.topActions}>
              <button type="button" aria-label="Undo" disabled={pastCount === 0 || operations.length > 0} onClick={() => store.getState().undo()}><Undo2 size={14} aria-hidden="true" /></button>
              <button type="button" aria-label="Redo" disabled={futureCount === 0 || operations.length > 0} onClick={() => store.getState().redo()}><Redo2 size={14} aria-hidden="true" /></button>
              <span className={`${styles.saveState} ${saveState === 'error' || saveState === 'conflict' ? styles.saveError : ''}`} role="status">{saveStatusText(saveState)}</span>
              {saveState === 'error' && <button type="button" className={styles.minorButton} onClick={retry}>Retry</button>}
              {saveState === 'conflict' && <button type="button" className={styles.minorButton} onClick={refreshCanvas}>Reload latest</button>}
              <span className={styles.revision}>rev {revision}</span>
            </div>
          </div>
        </header>

        <div
          className={styles.viewport}
          onPointerCancel={endPan}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onWheel={onWheel}
          ref={viewportRef}
        >
          <div className={styles.dotField} data-canvas-background="true" />
          <div className={styles.world} style={{ width: worldWidth, transform: `translate(calc(-50% + ${viewport.x}px), calc(-50% + ${viewport.y}px)) scale(${viewport.zoom})` }}>
            <div className={compareMode ? styles.framePair : undefined}>
              <CanvasFrameView document={document} breakpoint={compareMode ? 'desktop' : activeBreakpoint} comparison={compareMode} onFrameClick={onFrameClick} onFrameDrop={onDrop} />
              {compareMode && <CanvasFrameView document={document} breakpoint="mobile" comparison onFrameClick={onFrameClick} onFrameDrop={onDrop} />}
            </div>
          </div>

          <AIComposer
            projectId={projectId}
            selectedNode={selectedNode}
            revision={revision}
            saveState={saveState}
            busy={operations.length > 0 || mutationIsPending}
            compareMode={compareMode}
            onApplied={applyAIEdit}
          />

          <div className={styles.canvasControls} aria-label="Canvas viewport controls">
            <button type="button" aria-label="Zoom out" onClick={() => store.getState().setViewport({ ...viewport, zoom: Math.max(0.25, viewport.zoom - 0.1) })}><ZoomOut size={15} aria-hidden="true" /></button>
            <span>{Math.round(viewport.zoom * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => store.getState().setViewport({ ...viewport, zoom: Math.min(1.25, viewport.zoom + 0.1) })}><ZoomIn size={15} aria-hidden="true" /></button>
            <button type="button" aria-label="Reset canvas position" onClick={() => store.getState().setViewport({ x: 0, y: 0, zoom: viewport.zoom })}><RotateCcw size={14} aria-hidden="true" /></button>
          </div>

          <div className={styles.dock} aria-label="Canvas tools">
            <button type="button" aria-pressed={activeTool === 'select'} onClick={() => store.getState().setActiveTool('select')}><MousePointer2 size={16} aria-hidden="true" /><span>Select</span></button>
            <button
              type="button"
              disabled={compareMode}
              aria-pressed={activeTool === 'text'}
              draggable
              onClick={() => store.getState().setActiveTool('text')}
              onDragStart={(event) => { event.dataTransfer.setData('application/x-forme-block', 'text'); event.dataTransfer.effectAllowed = 'copy' }}
            ><Type size={16} aria-hidden="true" /><span>Text</span></button>
            <details className={styles.blockMenu}>
              <summary><Layers3 size={16} aria-hidden="true" /><span>Blocks</span><ChevronDown size={12} aria-hidden="true" /></summary>
              <div className={styles.blockPanel}>
                {blockCategories.map((category) => (
                  <section key={category}>
                    <h3>{category === 'ui' ? 'UI blocks' : category === 'section' ? 'Section templates' : 'Primitives'}</h3>
                    <div>{blockDefinitions.filter((block) => block.category === category).map((block) => (
                      <button key={block.id} draggable disabled={compareMode} type="button" onClick={() => store.getState().addBlock(block.id, undefined, null, activeBreakpoint)} onDragStart={(event) => { event.dataTransfer.setData('application/x-forme-block', block.id); event.dataTransfer.effectAllowed = 'copy' }}>{block.label}</button>
                    ))}</div>
                  </section>
                ))}
                {Object.values(customBlocks).length > 0 && <section>
                  <h3>Custom blocks</h3>
                  <div>{Object.values(customBlocks).map((block) => <button key={block.id} type="button" disabled={compareMode} onClick={() => store.getState().instantiateCustomBlock(block.id)}>{block.name}</button>)}</div>
                </section>}
              </div>
            </details>
            <button className={styles.toolLater} disabled title="Frame management arrives with responsive frames"><Frame size={16} aria-hidden="true" /><span>Frame</span></button>
            <span className={styles.panHint}><Hand size={13} aria-hidden="true" />Drag empty canvas to pan</span>
          </div>
        </div>
      </section>

      <aside className={shell.inspector} aria-label="Profile, share, export, and inspector">
        <section className={shell.profile} aria-labelledby="profile-title">
          <h2 id="profile-title">Profile</h2>
          <div className={shell.identity}><span className={shell.avatar} aria-hidden="true">{(name || email).slice(0, 1).toUpperCase()}</span><div><strong>{name || 'FORME member'}</strong><span>{email}</span></div></div>
          <LogoutButton />
        </section>
        <section className={shell.panelSection} aria-labelledby="share-title"><h2 id="share-title">Share</h2><p>Private to your account</p><span className={shell.coming}>Sharing arrives later</span></section>
        <section className={shell.panelSection} aria-labelledby="export-title"><h2 id="export-title">Export</h2><p>Current canvas saved</p><span className={shell.coming}>Export arrives later</span></section>
        <section className={`${shell.panelSection} ${shell.inspectorSection}`} aria-labelledby="inspector-title">
          <h2 id="inspector-title">Inspector</h2>
          {selectedNode ? (
            <NodeInspectorForm
              key={selectedNode.id}
              node={selectedNode}
              breakpoint={activeBreakpoint}
              busy={operations.length > 0}
              onApply={(changes) => store.getState().editNode(selectedNode.id, changes)}
              onVisibility={(breakpoint, visible) => store.getState().editNode(selectedNode.id, {
                visibilityByBreakpoint: { ...selectedNode.visibilityByBreakpoint, [breakpoint]: visible },
              })}
              onDuplicate={() => store.getState().duplicateNode(selectedNode.id)}
              onDelete={() => store.getState().deleteNode(selectedNode.id)}
              onSaveAsBlock={(blockName) => store.getState().saveNodeAsCustomBlock(selectedNode.id, blockName)}
            />
          ) : <div className={shell.noSelection}><MousePointer2 size={17} aria-hidden="true" /><p>Select a node to inspect its properties.</p></div>}
          <div className={styles.layers}>
            <h3>Layers <span>{layers.length}</span></h3>
            {layers.length === 0 ? <p className={styles.noLayers}>Nodes will appear here.</p> : layers.map(({ node, depth }) => {
              const siblings = node.parentId ? document.nodes[node.parentId]?.children ?? [] : document.rootIds
              const index = siblings.indexOf(node.id)
              return <div className={styles.layerRow} key={node.id}>
                <button aria-pressed={selectedNodeId === node.id} onClick={() => store.getState().selectNode(node.id)} style={{ paddingLeft: `${8 + depth * 12}px` }} type="button"><span>{node.label}</span><small>{node.type}</small></button>
                <button aria-label={`Move ${node.label} up`} disabled={index <= 0 || operations.length > 0} onClick={() => store.getState().reorderNode(node.id, -1)} type="button"><ArrowUp size={13} aria-hidden="true" /></button>
                <button aria-label={`Move ${node.label} down`} disabled={index < 0 || index >= siblings.length - 1 || operations.length > 0} onClick={() => store.getState().reorderNode(node.id, 1)} type="button"><ArrowDown size={13} aria-hidden="true" /></button>
              </div>
            })}
          </div>
          {saveError && <p className={styles.inlineError} role="alert">{saveError}</p>}
        </section>
      </aside>
    </main>
  )
}
