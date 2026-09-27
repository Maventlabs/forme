import { parseCanvasDocument, type NodeType } from '@forme/design-ir'

export type ProjectPreviewKind = 'heading' | 'copy' | 'media' | 'control' | 'structure' | 'block'

export type ProjectCanvasSummary = {
  nodeCount: number
  preview: Array<{ kind: ProjectPreviewKind; depth: number }>
}

function previewKind(type: NodeType): ProjectPreviewKind {
  if (type === 'heading') return 'heading'
  if (type === 'text' || type === 'paragraph' || type === 'quote') return 'copy'
  if (type === 'image' || type === 'gif') return 'media'
  if (type === 'button' || type === 'input') return 'control'
  if (type === 'container' || type === 'stack' || type === 'grid' || type.endsWith('-section')) return 'structure'
  return 'block'
}

export function summarizeProjectCanvas(input: unknown): ProjectCanvasSummary {
  const canvas = parseCanvasDocument(input)
  const preview: ProjectCanvasSummary['preview'] = []

  function visit(nodeId: string, depth: number) {
    if (preview.length >= 8) return
    const node = canvas.nodes[nodeId]
    if (!node || !node.visible || !node.visibilityByBreakpoint.desktop) return

    preview.push({ kind: previewKind(node.type), depth: Math.min(depth, 2) })
    node.children.forEach((childId) => visit(childId, depth + 1))
  }

  canvas.rootIds.forEach((nodeId) => visit(nodeId, 0))
  return { nodeCount: Object.keys(canvas.nodes).length, preview }
}
