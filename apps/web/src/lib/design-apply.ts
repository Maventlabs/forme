import {
  breakpointNames,
  parseCanvasDocument,
  type CanvasDocument,
  type DesignNode,
  type NodeLayout,
} from '@forme/design-ir'
import { type DesignContextRules } from './design-context-rules'
import { type DesignPreset } from './design-presets'

// Presentation tokens that can be applied to a canvas without touching its
// semantic structure. Only spacing/rhythm fields are rewritten: node identity,
// blockId/type, label, parent/children, root ordering, visibility and props
// are always preserved exactly.
export type DesignTokens = {
  spacingUnit: number
  radius: number
  density: 'compact' | 'comfortable' | 'spacious'
  sectionGap: number
  maxContentWidth: number
}

const densityFactor: Record<DesignTokens['density'], number> = {
  compact: 0.85,
  comfortable: 1,
  spacious: 1.2,
}

const MAX_SPACING = 2_048
const MAX_DEPTH = 32

function clampSpacing(value: number) {
  return Math.min(MAX_SPACING, Math.max(0, Math.round(value)))
}

/** Depth of a node inside the canvas tree, bounded so a malformed graph cannot loop. */
function nodeDepth(document: CanvasDocument, nodeId: string): number {
  let depth = 0
  let current = document.nodes[nodeId]?.parentId ?? null
  while (current && depth < MAX_DEPTH) {
    depth += 1
    current = document.nodes[current]?.parentId ?? null
  }
  return depth
}

function applyLayout(layout: NodeLayout, gap: number, padding: number): NodeLayout {
  return { ...layout, gap: clampSpacing(gap), padding: clampSpacing(padding) }
}

/**
 * Apply design tokens to a canvas. Returns a new validated document; the
 * structural graph (ids, types, hierarchy, ordering, props) is identical to the
 * input, which is what makes preset/DESIGN.md application non-destructive.
 *
 * Spacing is written as an absolute value derived from the node's depth rather
 * than as a multiplier, so applying the same preset twice is idempotent and
 * two different canvases converge on the same rhythm.
 */
export function applyDesignTokens(documentInput: unknown, tokens: DesignTokens, styleRef: string): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const unit = tokens.spacingUnit * densityFactor[tokens.density]

  const nodes: Record<string, DesignNode> = {}
  for (const [id, node] of Object.entries(document.nodes)) {
    const depth = nodeDepth(document, id)
    const gap = clampSpacing(unit * (depth + 1))
    const padding = clampSpacing(unit * (depth + 2))

    const layouts = { ...node.layouts }
    for (const breakpoint of breakpointNames) {
      const layout = layouts[breakpoint]
      if (layout) layouts[breakpoint] = applyLayout(layout, gap, padding)
    }
    nodes[id] = { ...node, layouts, styleRef: styleRef.slice(0, 120) }
  }

  return parseCanvasDocument({
    ...document,
    nodes,
    rootIds: [...document.rootIds],
  })
}

export function tokensFromPreset(preset: DesignPreset): DesignTokens {
  return {
    spacingUnit: preset.spacingUnit,
    radius: preset.radius,
    density: preset.density,
    sectionGap: preset.sectionGap,
    maxContentWidth: preset.maxContentWidth,
  }
}

/**
 * Convert parsed DESIGN.md rules into design tokens. Missing values fall back
 * to the neutral defaults so partial documents still apply deterministically.
 */
export function tokensFromDesignContext(rules: DesignContextRules): DesignTokens {
  return {
    spacingUnit: rules.spacingUnit ?? 6,
    radius: rules.radius ?? 6,
    density: rules.density ?? 'comfortable',
    sectionGap: rules.sectionGap ?? 64,
    maxContentWidth: rules.maxContentWidth ?? 1_200,
  }
}

/** Structural fingerprint used by tests and E2E to prove nothing but presentation changed. */
export function structuralFingerprint(documentInput: unknown) {
  const document = parseCanvasDocument(documentInput)
  return JSON.stringify({
    rootIds: document.rootIds,
    nodes: Object.fromEntries(Object.entries(document.nodes).map(([id, node]) => [id, {
      id: node.id,
      blockId: node.blockId,
      type: node.type,
      label: node.label,
      parentId: node.parentId,
      children: node.children,
      visible: node.visible,
      props: node.props,
    }])),
  })
}