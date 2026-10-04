import { parseCanvasDocument } from '@forme/design-ir'
import type { DesignNode } from '@forme/design-ir'

// Semantic wireframe export to SVG.
//
// Produces a real artifact from the persisted canvas: grayscale only (per
// FORME-DESIGN.md wireframe rules), deterministic output, and every text value
// XML-escaped so project content can never inject markup.

const DEPTH_GRAY = ['#F2F2F2', '#ECECEC', '#E1E1E1', '#D3D3D3', '#C3C3C3', '#B3B3B3', '#898989']
const DEFAULT_WIDTHS = { desktop: 1440, tablet: 768, mobile: 390 } as const

export type ExportBreakpoint = keyof typeof DEFAULT_WIDTHS

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

type Box = { x: number; y: number; width: number; height: number }

function layoutFor(node: DesignNode, breakpoint: ExportBreakpoint) {
  return node.layouts[breakpoint] ?? node.layouts.desktop
}

/** `fill`/`auto` are editor defaults, not concrete export dimensions. */
function numericDimension(value: number | 'fill' | 'auto', fallback: number) {
  return typeof value === 'number' ? value : fallback
}

/**
 * Deterministic depth-first layout. Containers are stacked vertically and
 * children inherit the parent's inner width, mirroring the flow/stack default
 * of the editor rather than inventing a layout the user never made.
 */
function layoutNodes(document: ReturnType<typeof parseCanvasDocument>, breakpoint: ExportBreakpoint, frameWidth: number) {
  const boxes = new Map<string, Box>()

  const layoutSubtree = (node: DesignNode, x: number, y: number, availableWidth: number): number => {
    const layout = layoutFor(node, breakpoint)
    const width = Math.min(numericDimension(layout.width, availableWidth), availableWidth)
    const innerX = x + layout.x + layout.padding
    const innerWidth = Math.max(0, width - layout.padding * 2)

    const childNodes = node.children
      .map((id) => document.nodes[id])
      .filter((child): child is DesignNode => Boolean(child))

    const heights: number[] = []
    for (const child of childNodes) {
      heights.push(layoutSubtree(child, innerX, y + layout.padding, innerWidth))
    }

    const declaredHeight = childNodes.length > 0
      ? heights.reduce((total, height) => total + height, 0) + layout.gap * Math.max(0, childNodes.length - 1)
      : 0
    const contentHeight = Math.max(declaredHeight, textHeight(node))
    const height = Math.max(numericDimension(layout.height, contentHeight + layout.padding * 2), 24)

    boxes.set(node.id, { x: x + layout.x, y, width, height })

    let childY = y + layout.padding
    for (let index = 0; index < childNodes.length; index += 1) {
      const child = childNodes[index]!
      const childLayout = layoutFor(child, breakpoint)
      const childWidth = Math.min(numericDimension(childLayout.width, innerWidth), innerWidth)
      const childHeight = heights[index] ?? numericDimension(childLayout.height, 24)
      boxes.set(child.id, { x: innerX, y: childY, width: childWidth, height: childHeight })
      childY += childHeight + childLayout.gap
    }

    return height
  }

  let cursor = 32
  for (const rootId of document.rootIds) {
    const root = document.nodes[rootId]
    if (!root) continue
    const height = layoutSubtree(root, 32, cursor, frameWidth - 64)
    cursor += height + layoutFor(root, breakpoint).gap
  }

  return { boxes, totalHeight: Math.max(320, cursor + 32) }
}

function textHeight(node: DesignNode) {
  return typeof node.props.text === 'string' && node.props.text.length > 0 ? 40 : 24
}

export function renderCanvasSvg(
  canvasInput: unknown,
  options: { projectName: string; breakpoint?: ExportBreakpoint },
): string {
  const document = parseCanvasDocument(canvasInput)
  const breakpoint = options.breakpoint ?? 'desktop'
  const frameWidth = DEFAULT_WIDTHS[breakpoint]
  const { boxes, totalHeight } = layoutNodes(document, breakpoint, frameWidth)

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${frameWidth}" height="${totalHeight}" viewBox="0 0 ${frameWidth} ${totalHeight}" role="img" aria-label="${escapeXml(options.projectName)} wireframe export">`,
    `<rect x="0" y="0" width="${frameWidth}" height="${totalHeight}" fill="#FFFFFF"/>`,
  ]

  const draw = (node: DesignNode, depth: number) => {
    const box = boxes.get(node.id)
    if (!box || !node.visible) return
    const fill = DEPTH_GRAY[Math.min(depth, DEPTH_GRAY.length - 1)]!
    const text = typeof node.props.text === 'string' ? node.props.text.slice(0, 120) : ''
    parts.push(`<g data-node-id="${escapeXml(node.id)}" data-node-type="${escapeXml(node.type)}">`)
    parts.push(`<rect x="${Math.round(box.x)}" y="${Math.round(box.y)}" width="${Math.round(box.width)}" height="${Math.round(box.height)}" fill="${fill}" stroke="#B3B3B3" stroke-width="1"/>`)
    if (text) {
      parts.push(`<text x="${Math.round(box.x) + 12}" y="${Math.round(box.y) + 24}" font-family="Instrument Sans, sans-serif" font-size="13" fill="#3A3A3A">${escapeXml(text)}</text>`)
    }
    parts.push('</g>')
    for (const childId of node.children) {
      const child = document.nodes[childId]
      if (child) draw(child, depth + 1)
    }
  }

  for (const rootId of document.rootIds) {
    const root = document.nodes[rootId]
    if (root) draw(root, 0)
  }

  parts.push('</svg>')
  return parts.join('')
}

export function renderCanvasJson(canvasInput: unknown, project: { name: string; revision: number }): string {
  const document = parseCanvasDocument(canvasInput)
  return JSON.stringify({
    format: 'forme-design-ir',
    version: 1,
    exportedAt: new Date().toISOString(),
    project: { name: project.name, revision: project.revision },
    breakpoints: document.breakpoints,
    nodes: document.nodes,
    rootIds: document.rootIds,
    customBlocks: document.customBlocks,
  }, null, 2)
}