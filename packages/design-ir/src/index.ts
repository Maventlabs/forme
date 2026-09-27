import { z } from 'zod'

export const breakpointNames = ['desktop', 'tablet', 'mobile'] as const
export type Breakpoint = (typeof breakpointNames)[number]

export const blockCategories = ['primitive', 'ui', 'section'] as const
export type BlockCategory = (typeof blockCategories)[number]

export const blockDefinitions = [
  { id: 'text', label: 'Text', category: 'primitive', type: 'text', defaultText: 'Text', acceptsChildren: false },
  { id: 'heading', label: 'Heading', category: 'primitive', type: 'heading', defaultText: 'Heading', acceptsChildren: false },
  { id: 'paragraph', label: 'Paragraph', category: 'primitive', type: 'paragraph', defaultText: 'Add a paragraph', acceptsChildren: false },
  { id: 'image', label: 'Image', category: 'primitive', type: 'image', defaultText: 'Image placeholder', acceptsChildren: false },
  { id: 'gif', label: 'GIF', category: 'primitive', type: 'gif', defaultText: 'GIF placeholder', acceptsChildren: false },
  { id: 'button', label: 'Button', category: 'primitive', type: 'button', defaultText: 'Button', acceptsChildren: false },
  { id: 'input', label: 'Input', category: 'primitive', type: 'input', defaultText: 'Input placeholder', acceptsChildren: false },
  { id: 'divider', label: 'Divider', category: 'primitive', type: 'divider', defaultText: 'Divider', acceptsChildren: false },
  { id: 'spacer', label: 'Spacer', category: 'primitive', type: 'spacer', defaultText: 'Spacer', acceptsChildren: false },
  { id: 'container', label: 'Container', category: 'primitive', type: 'container', defaultText: 'Container', acceptsChildren: true },
  { id: 'stack', label: 'Stack', category: 'primitive', type: 'stack', defaultText: 'Stack', acceptsChildren: true },
  { id: 'grid', label: 'Grid', category: 'primitive', type: 'grid', defaultText: 'Grid', acceptsChildren: true },

  { id: 'navbar', label: 'Navbar', category: 'ui', type: 'navbar', defaultText: 'Navigation', acceptsChildren: true },
  { id: 'footer', label: 'Footer', category: 'ui', type: 'footer', defaultText: 'Footer', acceptsChildren: true },
  { id: 'card', label: 'Card', category: 'ui', type: 'card', defaultText: 'Card', acceptsChildren: true },
  { id: 'form', label: 'Form', category: 'ui', type: 'form', defaultText: 'Form', acceptsChildren: true },
  { id: 'search', label: 'Search', category: 'ui', type: 'search', defaultText: 'Search', acceptsChildren: false },
  { id: 'tabs', label: 'Tabs', category: 'ui', type: 'tabs', defaultText: 'Tabs', acceptsChildren: true },
  { id: 'accordion', label: 'Accordion', category: 'ui', type: 'accordion', defaultText: 'Accordion', acceptsChildren: true },
  { id: 'sidebar', label: 'Sidebar', category: 'ui', type: 'sidebar', defaultText: 'Sidebar', acceptsChildren: true },
  { id: 'breadcrumb', label: 'Breadcrumb', category: 'ui', type: 'breadcrumb', defaultText: 'Breadcrumb', acceptsChildren: true },
  { id: 'pagination', label: 'Pagination', category: 'ui', type: 'pagination', defaultText: 'Pagination', acceptsChildren: false },
  { id: 'table', label: 'Table', category: 'ui', type: 'table', defaultText: 'Table', acceptsChildren: true },
  { id: 'list', label: 'List', category: 'ui', type: 'list', defaultText: 'List', acceptsChildren: true },
  { id: 'badge', label: 'Badge', category: 'ui', type: 'badge', defaultText: 'Badge', acceptsChildren: false },
  { id: 'avatar', label: 'Avatar', category: 'ui', type: 'avatar', defaultText: 'Avatar', acceptsChildren: false },
  { id: 'alert', label: 'Alert', category: 'ui', type: 'alert', defaultText: 'Alert', acceptsChildren: true },
  { id: 'modal', label: 'Modal placeholder', category: 'ui', type: 'modal', defaultText: 'Modal', acceptsChildren: true },
  { id: 'dropdown', label: 'Dropdown', category: 'ui', type: 'dropdown', defaultText: 'Dropdown', acceptsChildren: true },
  { id: 'stats', label: 'Stats', category: 'ui', type: 'stats', defaultText: 'Stats', acceptsChildren: true },
  { id: 'quote', label: 'Quote', category: 'ui', type: 'quote', defaultText: 'Quote', acceptsChildren: true },
  { id: 'logo-cloud', label: 'Logo cloud', category: 'ui', type: 'logo-cloud', defaultText: 'Logo cloud', acceptsChildren: true },

  { id: 'hero-section', label: 'Hero', category: 'section', type: 'hero-section', defaultText: 'Hero section', acceptsChildren: true },
  { id: 'features-section', label: 'Features', category: 'section', type: 'features-section', defaultText: 'Features section', acceptsChildren: true },
  { id: 'pricing-section', label: 'Pricing', category: 'section', type: 'pricing-section', defaultText: 'Pricing section', acceptsChildren: true },
  { id: 'testimonials-section', label: 'Testimonials', category: 'section', type: 'testimonials-section', defaultText: 'Testimonials section', acceptsChildren: true },
  { id: 'faq-section', label: 'FAQ', category: 'section', type: 'faq-section', defaultText: 'FAQ section', acceptsChildren: true },
  { id: 'cta-section', label: 'CTA', category: 'section', type: 'cta-section', defaultText: 'CTA section', acceptsChildren: true },
  { id: 'gallery-section', label: 'Gallery', category: 'section', type: 'gallery-section', defaultText: 'Gallery section', acceptsChildren: true },
  { id: 'stats-section', label: 'Stats', category: 'section', type: 'stats-section', defaultText: 'Stats section', acceptsChildren: true },
  { id: 'team-section', label: 'Team', category: 'section', type: 'team-section', defaultText: 'Team section', acceptsChildren: true },
  { id: 'contact-section', label: 'Contact', category: 'section', type: 'contact-section', defaultText: 'Contact section', acceptsChildren: true },
  { id: 'blog-list-section', label: 'Blog list', category: 'section', type: 'blog-list-section', defaultText: 'Blog list section', acceptsChildren: true },
  { id: 'dashboard-header', label: 'Dashboard header', category: 'section', type: 'dashboard-header', defaultText: 'Dashboard header', acceptsChildren: true },
  { id: 'dashboard-sidebar', label: 'Dashboard sidebar', category: 'section', type: 'dashboard-sidebar', defaultText: 'Dashboard sidebar', acceptsChildren: true },
  { id: 'settings-section', label: 'Settings', category: 'section', type: 'settings-section', defaultText: 'Settings section', acceptsChildren: true },
  { id: 'authentication-section', label: 'Authentication', category: 'section', type: 'authentication-section', defaultText: 'Authentication section', acceptsChildren: true },
] as const

export type BlockId = (typeof blockDefinitions)[number]['id']
export type NodeType = (typeof blockDefinitions)[number]['type']
export type BlockDefinition = {
  readonly id: BlockId
  readonly label: string
  readonly category: BlockCategory
  readonly type: NodeType
  readonly defaultText: string
  readonly acceptsChildren: boolean
}

export const blocksById = Object.fromEntries(
  blockDefinitions.map((block) => [block.id, block]),
) as Record<BlockId, BlockDefinition>

export const blockIdSchema = z.enum(blockDefinitions.map((block) => block.id) as [BlockId, ...BlockId[]])
export const nodeTypeSchema = z.enum(blockDefinitions.map((block) => block.type) as [NodeType, ...NodeType[]])
const scalarPropSchema = z.union([z.string().max(2_000), z.number().finite(), z.boolean()])
export const nodePropsSchema = z.record(z.string().min(1).max(80), scalarPropSchema).refine((props) => Object.keys(props).length <= 80)

export const dimensionSchema = z.union([
  z.number().finite().min(1).max(10_000),
  z.enum(['auto', 'fill']),
])

export const layoutModeSchema = z.enum(['flow', 'stack', 'grid', 'absolute'])
export const alignmentSchema = z.enum(['start', 'center', 'end', 'stretch'])

function defaultLayout(mode: z.infer<typeof layoutModeSchema> = 'flow') {
  return {
    mode,
    x: 0,
    y: 0,
    width: 'fill' as const,
    height: 'auto' as const,
    order: 0,
    gap: 0,
    padding: 0,
    alignment: 'stretch' as const,
    justify: 'start' as const,
  }
}

export const nodeLayoutSchema = z.object({
  mode: layoutModeSchema.default('flow'),
  x: z.number().finite().min(-100_000).max(100_000).default(0),
  y: z.number().finite().min(-100_000).max(100_000).default(0),
  width: dimensionSchema.default('fill'),
  height: dimensionSchema.default('auto'),
  order: z.number().int().min(-10_000).max(10_000).default(0),
  gap: z.number().finite().min(0).max(2_048).default(0),
  padding: z.number().finite().min(0).max(2_048).default(0),
  alignment: alignmentSchema.default('stretch'),
  justify: alignmentSchema.default('start'),
}).strict()

export const nodeLayoutsSchema = z.object({
  desktop: nodeLayoutSchema,
  tablet: nodeLayoutSchema.optional(),
  mobile: nodeLayoutSchema.optional(),
}).strict()

export const breakpointVisibilitySchema = z.object({
  desktop: z.boolean(),
  tablet: z.boolean(),
  mobile: z.boolean(),
}).strict()

export const designNodeSchema = z.object({
  id: z.string().uuid(),
  blockId: blockIdSchema,
  customBlockId: z.string().uuid().nullable().default(null),
  type: nodeTypeSchema,
  label: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().nullable(),
  children: z.array(z.string().uuid()).max(500),
  props: nodePropsSchema,
  layouts: nodeLayoutsSchema,
  visible: z.boolean(),
  visibilityByBreakpoint: breakpointVisibilitySchema,
  styleRef: z.string().trim().max(120).nullable(),
}).strict().superRefine((node, context) => {
  const block = blocksById[node.blockId]
  if (node.type !== block.type) {
    context.addIssue({ code: 'custom', path: ['type'], message: 'Node type must match its reusable block.' })
  }
  if (!block.acceptsChildren && node.children.length > 0) {
    context.addIssue({ code: 'custom', path: ['children'], message: 'This block cannot contain child nodes.' })
  }
})

export type DesignNode = z.infer<typeof designNodeSchema>
export type NodeLayout = z.infer<typeof nodeLayoutSchema>
export type NodeProps = z.infer<typeof nodePropsSchema>
export type BreakpointDefinition = { width: number; height: number | 'auto' }

export const customBlockDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  rootId: z.string().uuid(),
  nodes: z.record(z.string().uuid(), designNodeSchema).refine((nodes) => Object.keys(nodes).length > 0 && Object.keys(nodes).length <= 500),
}).strict().superRefine((block, context) => {
  const root = block.nodes[block.rootId]
  if (!root || root.parentId !== null) {
    context.addIssue({ code: 'custom', path: ['rootId'], message: 'Custom block root must be a root node in its template.' })
  }
  for (const [key, node] of Object.entries(block.nodes)) {
    if (key !== node.id || node.customBlockId !== null) {
      context.addIssue({ code: 'custom', path: ['nodes', key], message: 'Custom block templates must contain stable base nodes.' })
    }
    if (node.parentId !== null && block.nodes[node.parentId]?.children.includes(node.id) !== true) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'parentId'], message: 'Template parent and child references must agree.' })
    }
    for (const childId of node.children) {
      if (block.nodes[childId]?.parentId !== node.id) {
        context.addIssue({ code: 'custom', path: ['nodes', key, 'children'], message: 'Template child references must resolve to their parent.' })
      }
    }
  }
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visited.has(id)) return
    visited.add(id)
    block.nodes[id]?.children.forEach(visit)
  }
  if (root) visit(root.id)
  if (visited.size !== Object.keys(block.nodes).length) {
    context.addIssue({ code: 'custom', path: ['nodes'], message: 'Every template node must be reachable from its root.' })
  }
})

export type CustomBlockDefinition = z.infer<typeof customBlockDefinitionSchema>

const canvasDocumentBaseSchema = z.object({
  schemaVersion: z.literal(1),
  nodes: z.record(z.string().uuid(), designNodeSchema).refine((nodes) => Object.keys(nodes).length <= 500),
  rootIds: z.array(z.string().uuid()).max(500),
  breakpoints: z.object({
    desktop: z.object({ width: z.number().int().min(320).max(4_096), height: z.union([z.number().int().min(240).max(20_000), z.literal('auto')]) }).strict(),
    tablet: z.object({ width: z.number().int().min(320).max(4_096), height: z.union([z.number().int().min(240).max(20_000), z.literal('auto')]) }).strict(),
    mobile: z.object({ width: z.number().int().min(320).max(4_096), height: z.union([z.number().int().min(240).max(20_000), z.literal('auto')]) }).strict(),
  }).strict(),
  customBlocks: z.record(z.string().uuid(), customBlockDefinitionSchema).default({}).refine((blocks) => Object.keys(blocks).length <= 100),
  designContextRef: z.string().uuid().nullable(),
}).strict()

export const canvasDocumentSchema = canvasDocumentBaseSchema.superRefine((document, context) => {
  const rootSet = new Set(document.rootIds)
  if (rootSet.size !== document.rootIds.length) {
    context.addIssue({ code: 'custom', path: ['rootIds'], message: 'Root node ids must be unique.' })
  }

  for (const rootId of document.rootIds) {
    const node = document.nodes[rootId]
    if (!node || node.parentId !== null) {
      context.addIssue({ code: 'custom', path: ['rootIds'], message: 'Every root id must refer to a root node.' })
    }
  }

  for (const [key, node] of Object.entries(document.nodes)) {
    if (key !== node.id) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'id'], message: 'Node map key must match node id.' })
    }
    if (node.parentId === null && !rootSet.has(node.id)) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'parentId'], message: 'Root nodes must appear in rootIds.' })
    }
    if (node.customBlockId !== null && !document.customBlocks[node.customBlockId]) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'customBlockId'], message: 'Custom block reference must exist in this canvas.' })
    }
    if (node.customBlockId !== null && document.customBlocks[node.customBlockId]?.nodes[document.customBlocks[node.customBlockId]?.rootId ?? '']?.type !== node.type) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'customBlockId'], message: 'Custom block instance type must match its template root.' })
    }
    if (node.parentId !== null) {
      const parent = document.nodes[node.parentId]
      if (!parent || !parent.children.includes(node.id)) {
        context.addIssue({ code: 'custom', path: ['nodes', key, 'parentId'], message: 'Parent and child references must agree.' })
      }
    }

    const childSet = new Set(node.children)
    if (childSet.size !== node.children.length) {
      context.addIssue({ code: 'custom', path: ['nodes', key, 'children'], message: 'Child ids must be unique.' })
    }
    for (const childId of node.children) {
      if (document.nodes[childId]?.parentId !== node.id) {
        context.addIssue({ code: 'custom', path: ['nodes', key, 'children'], message: 'Child references must resolve to this parent.' })
      }
    }
  }

  const visited = new Set<string>()
  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)
    document.nodes[nodeId]?.children.forEach(visit)
  }
  document.rootIds.forEach(visit)
  if (visited.size !== Object.keys(document.nodes).length) {
    context.addIssue({ code: 'custom', path: ['nodes'], message: 'Every node must be reachable from a root node.' })
  }
  for (const [key, block] of Object.entries(document.customBlocks)) {
    if (key !== block.id) {
      context.addIssue({ code: 'custom', path: ['customBlocks', key, 'id'], message: 'Custom block map key must match its id.' })
    }
  }
})

export type CanvasDocument = z.infer<typeof canvasDocumentSchema>

export function createEmptyCanvasDocument(): CanvasDocument {
  return canvasDocumentSchema.parse({
    schemaVersion: 1,
    nodes: {},
    rootIds: [],
    breakpoints: {
      desktop: { width: 1_440, height: 'auto' },
      tablet: { width: 768, height: 'auto' },
      mobile: { width: 390, height: 'auto' },
    },
    customBlocks: {},
    designContextRef: null,
  })
}

export function parseCanvasDocument(input: unknown): CanvasDocument {
  return canvasDocumentSchema.parse(input)
}

export function validateCanvasDocument(input: unknown) {
  return canvasDocumentSchema.safeParse(input)
}

export function createNodeFromBlock(
  blockId: BlockId,
  options: {
    id?: string
    parentId?: string | null
    customBlockId?: string | null
    label?: string
    props?: NodeProps
    layouts?: Partial<Record<Breakpoint, Partial<NodeLayout>>>
  } = {},
): DesignNode {
  const block = blocksById[blockId]
  if (!block) throw new Error('UNKNOWN_BLOCK')
  const mode = block.type === 'stack' || block.category === 'section' ? 'stack' : block.type === 'grid' ? 'grid' : 'flow'
  const layout = defaultLayout(mode)
  const layouts = {
    desktop: nodeLayoutSchema.parse({ ...layout, ...options.layouts?.desktop }),
    tablet: nodeLayoutSchema.parse({ ...layout, ...options.layouts?.tablet }),
    mobile: nodeLayoutSchema.parse({ ...layout, ...options.layouts?.mobile }),
  }

  return designNodeSchema.parse({
    id: options.id ?? globalThis.crypto.randomUUID(),
    blockId,
    type: block.type,
    label: options.label ?? block.label,
    parentId: options.parentId ?? null,
    children: [],
    customBlockId: options.customBlockId ?? null,
    props: { text: block.defaultText, ...options.props },
    layouts,
    visible: true,
    visibilityByBreakpoint: { desktop: true, tablet: true, mobile: true },
    styleRef: null,
  })
}

export function insertNode(documentInput: unknown, nodeInput: unknown): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const node = designNodeSchema.parse(nodeInput)
  if (document.nodes[node.id]) throw new Error('NODE_ID_CONFLICT')

  const nodes = { ...document.nodes }
  let rootIds = [...document.rootIds]
  if (node.parentId === null) {
    rootIds.push(node.id)
  } else {
    const parent = nodes[node.parentId]
    if (!parent) throw new Error('PARENT_NOT_FOUND')
    if (!blocksById[parent.blockId].acceptsChildren) throw new Error('PARENT_CANNOT_CONTAIN_CHILDREN')
    nodes[parent.id] = designNodeSchema.parse({ ...parent, children: [...parent.children, node.id] })
  }
  nodes[node.id] = node
  return parseCanvasDocument({ ...document, nodes, rootIds })
}

export function updateNode(
  documentInput: unknown,
  nodeId: string,
  changes: Partial<Pick<DesignNode, 'label' | 'props' | 'layouts' | 'visible' | 'visibilityByBreakpoint' | 'styleRef'>>,
): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const current = document.nodes[nodeId]
  if (!current) throw new Error('NODE_NOT_FOUND')

  const node = designNodeSchema.parse({
    ...current,
    ...changes,
    layouts: { ...current.layouts, ...changes.layouts },
  })
  return parseCanvasDocument({ ...document, nodes: { ...document.nodes, [nodeId]: node } })
}

export function removeNode(documentInput: unknown, nodeId: string): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const target = document.nodes[nodeId]
  if (!target) throw new Error('NODE_NOT_FOUND')

  const removing = new Set<string>()
  const collect = (currentId: string) => {
    if (removing.has(currentId)) return
    removing.add(currentId)
    document.nodes[currentId]?.children.forEach(collect)
  }
  collect(nodeId)

  const nodes = { ...document.nodes }
  for (const id of removing) delete nodes[id]

  let rootIds = document.rootIds
  if (target.parentId === null) {
    rootIds = rootIds.filter((id) => id !== nodeId)
  } else {
    const parent = nodes[target.parentId]
    if (!parent) throw new Error('INVALID_PARENT_REFERENCE')
    nodes[parent.id] = designNodeSchema.parse({
      ...parent,
      children: parent.children.filter((id) => id !== nodeId),
    })
  }

  return parseCanvasDocument({ ...document, nodes, rootIds })
}

export function duplicateNode(
  documentInput: unknown,
  nodeId: string,
  idFactory: () => string = () => globalThis.crypto.randomUUID(),
): { document: CanvasDocument; nodeId: string } {
  const document = parseCanvasDocument(documentInput)
  const target = document.nodes[nodeId]
  if (!target) throw new Error('NODE_NOT_FOUND')

  const subtreeIds: string[] = []
  const collect = (currentId: string) => {
    const current = document.nodes[currentId]
    if (!current) throw new Error('NODE_NOT_FOUND')
    subtreeIds.push(currentId)
    current.children.forEach(collect)
  }
  collect(nodeId)

  const idMap = new Map(subtreeIds.map((id) => [id, idFactory()]))
  if (new Set(idMap.values()).size !== idMap.size || [...idMap.values()].some((id) => document.nodes[id])) {
    throw new Error('DUPLICATE_NODE_ID')
  }

  const nodes = { ...document.nodes }
  for (const originalId of subtreeIds) {
    const original = document.nodes[originalId]!
    const copyId = idMap.get(originalId)!
    const parentId = originalId === nodeId ? original.parentId : idMap.get(original.parentId!)!
    nodes[copyId] = designNodeSchema.parse({
      ...original,
      id: copyId,
      parentId,
      children: original.children.map((childId) => idMap.get(childId)),
    })
  }

  const duplicateRootId = idMap.get(nodeId)!
  let rootIds = document.rootIds
  if (target.parentId === null) {
    const index = rootIds.indexOf(nodeId)
    rootIds = [...rootIds.slice(0, index + 1), duplicateRootId, ...rootIds.slice(index + 1)]
  } else {
    const parent = nodes[target.parentId]
    if (!parent) throw new Error('INVALID_PARENT_REFERENCE')
    const index = parent.children.indexOf(nodeId)
    nodes[parent.id] = designNodeSchema.parse({
      ...parent,
      children: [...parent.children.slice(0, index + 1), duplicateRootId, ...parent.children.slice(index + 1)],
    })
  }

  const siblings = target.parentId === null ? rootIds : nodes[target.parentId]!.children
  for (const [order, siblingId] of siblings.entries()) {
    const sibling = nodes[siblingId]!
    const layouts = Object.fromEntries(
      breakpointNames.map((breakpoint) => {
        const layout = sibling.layouts[breakpoint]
        return [breakpoint, layout ? { ...layout, order } : layout]
      }),
    )
    nodes[siblingId] = designNodeSchema.parse({ ...sibling, layouts })
  }

  return { document: parseCanvasDocument({ ...document, nodes, rootIds }), nodeId: duplicateRootId }
}

export function reorderNode(documentInput: unknown, nodeId: string, direction: -1 | 1): CanvasDocument {
  const document = parseCanvasDocument(documentInput)
  const node = document.nodes[nodeId]
  if (!node) throw new Error('NODE_NOT_FOUND')

  const siblings = node.parentId === null ? [...document.rootIds] : [...document.nodes[node.parentId]!.children]
  const index = siblings.indexOf(nodeId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) return document
  ;[siblings[index], siblings[nextIndex]] = [siblings[nextIndex]!, siblings[index]!]

  const nodes = { ...document.nodes }
  if (node.parentId === null) {
    for (const [order, siblingId] of siblings.entries()) {
      const sibling = nodes[siblingId]!
      nodes[siblingId] = designNodeSchema.parse({
        ...sibling,
        layouts: { ...sibling.layouts, desktop: { ...sibling.layouts.desktop, order } },
      })
    }
  } else {
    const parent = nodes[node.parentId]!
    nodes[parent.id] = designNodeSchema.parse({ ...parent, children: siblings })
    for (const [order, siblingId] of siblings.entries()) {
      const sibling = nodes[siblingId]!
      nodes[siblingId] = designNodeSchema.parse({
        ...sibling,
        layouts: { ...sibling.layouts, desktop: { ...sibling.layouts.desktop, order } },
      })
    }
  }

  return parseCanvasDocument({ ...document, nodes, rootIds: node.parentId === null ? siblings : document.rootIds })
}

export function createCustomBlockFromNode(
  documentInput: unknown,
  nodeId: string,
  name: string,
  id = globalThis.crypto.randomUUID(),
): { document: CanvasDocument; block: CustomBlockDefinition } {
  const document = parseCanvasDocument(documentInput)
  const root = document.nodes[nodeId]
  if (!root) throw new Error('NODE_NOT_FOUND')

  const templateIds: string[] = []
  const collect = (currentId: string) => {
    const current = document.nodes[currentId]
    if (!current) throw new Error('NODE_NOT_FOUND')
    templateIds.push(currentId)
    current.children.forEach(collect)
  }
  collect(nodeId)

  const nodes = Object.fromEntries(templateIds.map((templateId) => {
    const node = document.nodes[templateId]!
    return [templateId, designNodeSchema.parse({
      ...node,
      parentId: templateId === nodeId ? null : node.parentId,
      customBlockId: null,
    })]
  }))
  const block = customBlockDefinitionSchema.parse({ id, name, rootId: nodeId, nodes })
  const existing = document.customBlocks[id]
  if (existing && !isSameCustomBlock(existing, block)) throw new Error('CUSTOM_BLOCK_ID_CONFLICT')

  return {
    document: parseCanvasDocument({
      ...document,
      customBlocks: { ...document.customBlocks, [id]: block },
    }),
    block,
  }
}

function isSameCustomBlock(left: CustomBlockDefinition, right: CustomBlockDefinition) {
  return stableSerialize(left) === stableSerialize(right)
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined'
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`
}

export function instantiateCustomBlock(
  documentInput: unknown,
  customBlockId: string,
  options: { idMap?: Record<string, string>; parentId?: string | null } = {},
): { document: CanvasDocument; nodeId: string; idMap: Record<string, string>; replayed: boolean } {
  const document = parseCanvasDocument(documentInput)
  const block = document.customBlocks[customBlockId]
  if (!block) throw new Error('CUSTOM_BLOCK_NOT_FOUND')

  const templateIds = Object.keys(block.nodes)
  const idMap = options.idMap ?? Object.fromEntries(templateIds.map((id) => [id, globalThis.crypto.randomUUID()]))
  const mappedIds = templateIds.map((id) => idMap[id])
  if (Object.keys(idMap).length !== templateIds.length || mappedIds.some((id) => !id) || new Set(mappedIds).size !== mappedIds.length) {
    throw new Error('INVALID_CUSTOM_BLOCK_ID_MAP')
  }
  if (mappedIds.some((id) => !z.string().uuid().safeParse(id).success)) {
    throw new Error('NODE_ID_CONFLICT')
  }

  const root = block.nodes[block.rootId]!
  const parentId = options.parentId ?? null
  if (parentId !== null) {
    const parent = document.nodes[parentId]
    if (!parent) throw new Error('PARENT_NOT_FOUND')
    if (!blocksById[parent.blockId].acceptsChildren) throw new Error('PARENT_CANNOT_CONTAIN_CHILDREN')
  }

  const instanceNodes: Record<string, DesignNode> = {}
  for (const templateId of templateIds) {
    const template = block.nodes[templateId]!
    const isRoot = templateId === block.rootId
    const newId = idMap[templateId]!
    const newParentId = isRoot ? parentId : idMap[template.parentId!]!
    const children = template.children.map((childId) => idMap[childId]!)
    instanceNodes[newId] = designNodeSchema.parse({
      ...template,
      id: newId,
      blockId: template.blockId,
      customBlockId: isRoot ? customBlockId : null,
      parentId: newParentId,
      children,
    })
  }

  const newRootId = idMap[block.rootId]!
  const existingIds = Object.keys(instanceNodes).filter((id) => document.nodes[id])
  if (existingIds.length > 0) {
    const replayed = existingIds.length === Object.keys(instanceNodes).length && Object.entries(instanceNodes).every(([id, node]) => {
      const existing = document.nodes[id]
      return existing !== undefined && stableSerialize(existing) === stableSerialize(node)
    })
    if (!replayed) throw new Error('NODE_ID_CONFLICT')
    return { document, nodeId: newRootId, idMap, replayed: true }
  }

  const nodes = { ...document.nodes, ...instanceNodes }
  const rootIds = parentId === null ? [...document.rootIds, newRootId] : document.rootIds
  if (parentId !== null) {
    const parent = nodes[parentId]!
    nodes[parentId] = designNodeSchema.parse({ ...parent, children: [...parent.children, newRootId] })
  }

  return {
    document: parseCanvasDocument({ ...document, nodes, rootIds }),
    nodeId: newRootId,
    idMap,
    replayed: false,
  }
}
