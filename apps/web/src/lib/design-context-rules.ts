// Canonical parsed representation of a user-supplied DESIGN.md context.
//
// Deliberately small and bounded: the parser extracts an explicit, auditable
// set of design tokens from markdown. It never executes instructions found in
// the document, and it never rewrites the semantic structure of the canvas.

export type DesignContextRules = {
  fontFamily: string | null
  baseFontSize: number | null
  spacingUnit: number | null
  radius: number | null
  density: 'compact' | 'comfortable' | 'spacious' | null
  maxContentWidth: number | null
  sectionGap: number | null
  notes: string[]
}

export const emptyDesignContextRules: DesignContextRules = {
  fontFamily: null,
  baseFontSize: null,
  spacingUnit: null,
  radius: null,
  density: null,
  maxContentWidth: null,
  sectionGap: null,
  notes: [],
}

export const designContextRulesSchema = {
  fontFamily: 'string | null',
  baseFontSize: 'positive number | null',
  spacingUnit: 'positive number | null',
  radius: 'non-negative number | null',
  density: "'compact' | 'comfortable' | 'spacious' | null",
  maxContentWidth: 'positive number | null',
  sectionGap: 'non-negative number | null',
  notes: 'string[]',
} as const

export const MAX_DESIGN_CONTEXT_BYTES = 256 * 1024
export const MAX_DESIGN_CONTEXT_NOTES = 40

function firstNumber(source: string, pattern: RegExp) {
  const match = pattern.exec(source)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

/**
 * Key/value lookups are line-anchored so a DESIGN.md document has one
 * predictable place where each token can be declared, e.g. `spacing unit: 8`.
 */
function keyNumber(source: string, keyPattern: string) {
  return firstNumber(source, new RegExp(`^[ \\t]*(?:${keyPattern})[ \\t]*[:=][ \\t]*(-?\\d+(?:\\.\\d+)?)`, 'im'))
}

function clampNumber(value: number | null, min: number, max: number) {
  if (value === null) return null
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * Parse a DESIGN.md document into canonical design rules.
 *
 * The document is treated as untrusted data: only explicit `key: value`
 * patterns are recognised, values are range-clamped, and at most a bounded
 * number of free-text notes are kept. Nothing from the document is executed.
 */
export function parseDesignContext(rawContent: string): DesignContextRules {
  const text = rawContent.slice(0, MAX_DESIGN_CONTEXT_BYTES)
  const lower = text.toLowerCase()

  const fontFamilyMatch = /^[ \t]*(?:font[- ]family|typography\.family|typeface)[ \t]*[:=][ \t]*([^\n\r]+)/im.exec(text)
  const fontFamily = fontFamilyMatch?.[1]?.trim().slice(0, 120) || null

  let density: DesignContextRules['density'] = null
  if (/\b(compact|dense|tight)\b/.test(lower)) density = 'compact'
  else if (/\b(spacious|roomy|airy)\b/.test(lower)) density = 'spacious'
  else if (/\b(comfortable|normal|balanced)\b/.test(lower)) density = 'comfortable'

  const spacingUnit = clampNumber(keyNumber(text, 'spacing\\s*(?:\\.\\s*)?(?:unit)?|base\\s*spacing|space\\s*unit'), 2, 32)
  const radius = clampNumber(keyNumber(text, 'radius|corner\\s*radius|border[- ]radius'), 0, 64)
  const baseFontSize = clampNumber(keyNumber(text, 'base\\s*font[- ]?size|font[- ]?size'), 8, 48)
  const maxContentWidth = clampNumber(keyNumber(text, 'max[- ]?(?:content\\s*)?width|container\\s*width'), 320, 2_560)
  const sectionGap = clampNumber(keyNumber(text, 'section\\s*(?:gap|spacing)|vertical\\s*rhythm'), 0, 256)

  const notes: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/^[-*>#\s]+/, '')
    if (!trimmed || trimmed.startsWith('```')) continue
    if (/^(font[- ]?family|spacing|radius|corner|base\s*font|max[- ]?width|section\s*gap|density)\b/i.test(trimmed)) continue
    notes.push(trimmed.slice(0, 200))
    if (notes.length >= MAX_DESIGN_CONTEXT_NOTES) break
  }

  return {
    fontFamily,
    baseFontSize,
    spacingUnit,
    radius,
    density,
    maxContentWidth,
    sectionGap,
    notes,
  }
}

export function hasDesignContextRules(rules: DesignContextRules) {
  return Boolean(
    rules.fontFamily
    || rules.baseFontSize !== null
    || rules.spacingUnit !== null
    || rules.radius !== null
    || rules.density !== null
    || rules.maxContentWidth !== null
    || rules.sectionGap !== null,
  )
}