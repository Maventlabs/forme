// Curated design presets.
//
// Presets are curated product content (not user data), so they live in code
// rather than the database. Applying a preset rewrites presentation tokens on
// the canonical Design IR only: node identity, semantic type, hierarchy and
// parent/child structure are never modified.

export type DesignPreset = {
  id: string
  name: string
  description: string
  spacingUnit: number
  radius: number
  density: 'compact' | 'comfortable' | 'spacious'
  sectionGap: number
  maxContentWidth: number
}

export const designPresets: readonly DesignPreset[] = [
  { id: 'editorial', name: 'Editorial', description: 'Generous rhythm, restrained radius, long-form reading.', spacingUnit: 8, radius: 2, density: 'spacious', sectionGap: 96, maxContentWidth: 1_280 },
  { id: 'dense-ops', name: 'Dense Ops', description: 'Tight spacing for information-dense product surfaces.', spacingUnit: 4, radius: 4, density: 'compact', sectionGap: 48, maxContentWidth: 1_440 },
  { id: 'system-neutral', name: 'System Neutral', description: 'Neutral defaults that defer to your own DESIGN.md.', spacingUnit: 6, radius: 6, density: 'comfortable', sectionGap: 64, maxContentWidth: 1_200 },
  { id: 'marketing-hero', name: 'Marketing Hero', description: 'Wide containers and large section separation for landing pages.', spacingUnit: 10, radius: 8, density: 'spacious', sectionGap: 120, maxContentWidth: 1_440 },
  { id: 'dashboard', name: 'Dashboard', description: 'Compact grid, small radius, predictable gutters.', spacingUnit: 4, radius: 6, density: 'compact', sectionGap: 40, maxContentWidth: 1_536 },
  { id: 'mobile-first', name: 'Mobile First', description: 'Narrow containers and single-column rhythm.', spacingUnit: 6, radius: 8, density: 'comfortable', sectionGap: 56, maxContentWidth: 480 },
  { id: 'technical-docs', name: 'Technical Docs', description: 'Dense reference layout with quiet separation.', spacingUnit: 6, radius: 2, density: 'compact', sectionGap: 48, maxContentWidth: 880 },
  { id: 'brand-bold', name: 'Brand Bold', description: 'Larger radius and confident spacing for consumer products.', spacingUnit: 10, radius: 14, density: 'comfortable', sectionGap: 88, maxContentWidth: 1_200 },
  { id: 'minimal-grid', name: 'Minimal Grid', description: 'Strict grid alignment with near-zero decoration.', spacingUnit: 8, radius: 0, density: 'comfortable', sectionGap: 72, maxContentWidth: 1_440 },
  { id: 'prototype-lab', name: 'Prototype Lab', description: 'Loose spacing for exploring many structural variants.', spacingUnit: 8, radius: 10, density: 'spacious', sectionGap: 104, maxContentWidth: 1_280 },
] as const

export const designPresetIds = designPresets.map((preset) => preset.id)

export function findDesignPreset(id: string) {
  return designPresets.find((preset) => preset.id === id) ?? null
}