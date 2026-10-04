import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode, updateNode } from '@forme/design-ir'
import { applyDesignTokens, structuralFingerprint, tokensFromDesignContext, tokensFromPreset } from './design-apply'
import { findDesignPreset, designPresets } from './design-presets'
import { parseDesignContext, hasDesignContextRules } from './design-context-rules'

function canvasWithSpacing() {
  const container = createNodeFromBlock('container', { label: 'Group' })
  let canvas = insertNode(createEmptyCanvasDocument(), container)
  const child = createNodeFromBlock('heading', { label: 'Title', parentId: container.id, props: { text: 'Hello' } })
  canvas = insertNode(canvas, child)
  canvas = updateNode(canvas, container.id, { layouts: { ...canvas.nodes[container.id]!.layouts, desktop: { ...canvas.nodes[container.id]!.layouts.desktop, gap: 24, padding: 32 } } })
  return { canvas, containerId: container.id, childId: child.id }
}

test('curated preset catalog has at least 10 distinct presets', () => {
  assert.ok(designPresets.length >= 10)
  assert.equal(new Set(designPresets.map((preset) => preset.id)).size, designPresets.length)
  assert.equal(findDesignPreset('editorial')?.name, 'Editorial')
  assert.equal(findDesignPreset('does-not-exist'), null)
})

test('applying a preset changes presentation but never structure', () => {
  const { canvas, containerId, childId } = canvasWithSpacing()
  const before = structuralFingerprint(canvas)
  const applied = applyDesignTokens(canvas, tokensFromPreset(findDesignPreset('dense-ops')!), 'forme:preset/dense-ops')

  assert.equal(structuralFingerprint(applied), before, 'semantic structure must be identical after preset application')
  assert.equal(Object.keys(applied.nodes).length, Object.keys(canvas.nodes).length)
  assert.deepEqual(applied.rootIds, canvas.rootIds)
  assert.equal(applied.nodes[containerId]?.children[0], childId, 'hierarchy must be preserved')
  assert.equal(applied.nodes[containerId]?.styleRef, 'forme:preset/dense-ops')

  const originalGap = canvas.nodes[containerId]!.layouts.desktop.gap
  const appliedGap = applied.nodes[containerId]!.layouts.desktop.gap
  assert.notEqual(appliedGap, originalGap, 'spacing must actually change')
  assert.ok(appliedGap < originalGap, 'a compact preset must tighten spacing')
})

test('preset application is idempotent for the same preset and deterministic across runs', () => {
  const { canvas } = canvasWithSpacing()
  const tokens = tokensFromPreset(findDesignPreset('editorial')!)
  const first = applyDesignTokens(canvas, tokens, 'forme:preset/editorial')
  const second = applyDesignTokens(first, tokens, 'forme:preset/editorial')
  assert.deepEqual(structuralFingerprint(second), structuralFingerprint(first))
  assert.equal(
    JSON.stringify(second.nodes),
    JSON.stringify(first.nodes),
    're-applying the same preset must produce byte-identical node data',
  )
})

test('DESIGN.md parser extracts bounded, clamped design tokens', () => {
  const rules = parseDesignContext([
    '# Design context',
    'font-family: Inter',
    'base font-size: 16',
    'spacing unit: 8',
    'radius: 12',
    'density: spacious',
    'max-width: 1200',
    'section gap: 96',
    '- Keep the canvas grayscale.',
  ].join('\n'))

  assert.equal(rules.fontFamily, 'Inter')
  assert.equal(rules.baseFontSize, 16)
  assert.equal(rules.spacingUnit, 8)
  assert.equal(rules.radius, 12)
  assert.equal(rules.density, 'spacious')
  assert.equal(rules.maxContentWidth, 1_200)
  assert.equal(rules.sectionGap, 96)
  assert.equal(hasDesignContextRules(rules), true)
})

test('DESIGN.md parser clamps hostile values and never throws on arbitrary text', () => {
  const rules = parseDesignContext('font-family: X\nspacing unit: 999999\nradius: 999\nmax-width: 1\nbase font-size: 900')
  assert.equal(rules.spacingUnit, 32, 'spacing must be clamped to the allowed maximum')
  assert.equal(rules.radius, 64, 'radius must be clamped to the allowed maximum')
  assert.equal(rules.maxContentWidth, 320, 'absurdly small width must be clamped up')
  assert.equal(rules.baseFontSize, 48, 'absurdly large font size must be clamped down')

  const negative = parseDesignContext('radius: -5')
  assert.equal(negative.radius, 0, 'negative radius must be clamped to zero, never rejected mid-parse')
  assert.equal(parseDesignContext(' random text').fontFamily, null)
})

test('DESIGN.md context applies without destroying semantic structure', () => {
  const { canvas } = canvasWithSpacing()
  const rules = parseDesignContext('spacing unit: 12\ndensity: compact')
  const applied = applyDesignTokens(canvas, tokensFromDesignContext(rules), 'forme:design-context/manual')
  assert.equal(structuralFingerprint(applied), structuralFingerprint(canvas))
  assert.ok(hasDesignContextRules(rules))
})