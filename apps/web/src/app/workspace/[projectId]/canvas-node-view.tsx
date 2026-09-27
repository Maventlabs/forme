'use client'

import { Image as ImageIcon, LayoutGrid, Type } from 'lucide-react'
import { blocksById, type BlockId, type Breakpoint } from '@forme/design-ir'
import { useCanvasStore } from './canvas-provider'
import styles from './canvas.module.css'

function NodeContent({ type, label, text }: { type: string; label: string; text: string }) {
  if (type === 'heading') return <span className={styles.headingContent}>{text || label}</span>
  if (type === 'paragraph' || type === 'text') return <span className={styles.textContent}>{text || label}</span>
  if (type === 'button') return <span className={styles.buttonContent}>{text || label}</span>
  if (type === 'input') return <span className={styles.inputContent}>{text || label}</span>
  if (type === 'image' || type === 'gif') return <span className={styles.mediaContent}><ImageIcon size={16} aria-hidden="true" />{text || `${type.toUpperCase()} placeholder · 16:10`}</span>
  if (type === 'divider') return <span className={styles.dividerContent} aria-hidden="true" />
  if (type === 'spacer') return <span className={styles.spacerContent}>{label}</span>
  if (type === 'grid' || type === 'stack' || type === 'container') return <span className={styles.structuralContent}><LayoutGrid size={14} aria-hidden="true" />{label}</span>
  return <span className={styles.blockContent}><Type size={14} aria-hidden="true" />{label}</span>
}

export function CanvasNodeView({ nodeId, breakpointOverride, readOnly = false }: { nodeId: string; breakpointOverride?: Breakpoint; readOnly?: boolean }) {
  const node = useCanvasStore((state) => state.document.nodes[nodeId])
  const selected = useCanvasStore((state) => state.selectedNodeIds.includes(nodeId))
  const activeBreakpoint = useCanvasStore((state) => state.activeBreakpoint)
  const breakpoint = breakpointOverride ?? activeBreakpoint
  const selectNode = useCanvasStore((state) => state.selectNode)
  const setBreakpoint = useCanvasStore((state) => state.setBreakpoint)
  const activeTool = useCanvasStore((state) => state.activeTool)
  const addBlock = useCanvasStore((state) => state.addBlock)
  if (!node) return null

  const layout = node.layouts[breakpoint] ?? node.layouts.desktop
  const visible = node.visible && node.visibilityByBreakpoint[breakpoint]
  if (!visible) return null

  const width = typeof layout.width === 'number' ? `${layout.width}px` : layout.width === 'fill' ? '100%' : 'auto'
  const height = typeof layout.height === 'number' ? `${layout.height}px` : layout.height === 'fill' ? '100%' : 'auto'
  const nodeStyle = {
    width,
    minHeight: typeof layout.height === 'number' ? height : undefined,
    order: layout.order,
    ...(layout.mode === 'absolute' ? { position: 'absolute' as const, left: layout.x, top: layout.y } : {}),
  }

  return (
    <div
      className={`${styles.nodeSlot} ${layout.mode === 'absolute' ? styles.absoluteNode : ''}`}
      onDragOver={(event) => {
        const droppedBlock = event.dataTransfer.getData('application/x-forme-block')
        if (droppedBlock && blocksById[droppedBlock as BlockId]?.acceptsChildren) event.preventDefault()
      }}
      onDrop={(event) => {
        const droppedBlock = event.dataTransfer.getData('application/x-forme-block')
        if (!droppedBlock || !blocksById[droppedBlock as BlockId]?.acceptsChildren) return
        event.preventDefault()
        event.stopPropagation()
        addBlock(droppedBlock as BlockId, undefined, node.id)
      }}
      style={nodeStyle}
    >
      <button
        aria-label={`${node.label}, ${node.type}`}
        aria-pressed={selected}
      className={`${styles.node} ${selected ? styles.nodeSelected : ''}`}
      data-node-id={node.id}
      data-node-type={node.type}
        draggable={!readOnly}
        onClick={(event) => {
          event.stopPropagation()
          if (breakpointOverride) setBreakpoint(breakpointOverride)
          if (activeTool === 'text' && blocksById[node.blockId].acceptsChildren) {
            addBlock('text', undefined, node.id)
          } else {
            selectNode(node.id)
          }
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData('application/x-forme-node', node.id)
          event.dataTransfer.effectAllowed = 'move'
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') selectNode(null)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        type="button"
      >
        <span className={styles.nodeLabel}>{node.label}</span>
        <NodeContent type={node.type} label={node.label} text={String(node.props.text ?? '')} />
      </button>
      {node.children.length > 0 && (
        <div className={styles.nodeChildren}>
          {node.children.map((childId) => <CanvasNodeView key={childId} nodeId={childId} breakpointOverride={breakpointOverride} readOnly={readOnly} />)}
        </div>
      )}
    </div>
  )
}
