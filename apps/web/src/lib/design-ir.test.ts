import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createEmptyCanvasDocument,
  createCustomBlockFromNode,
  createNodeFromBlock,
  blockDefinitions,
  duplicateNode,
  insertNode,
  instantiateCustomBlock,
  parseCanvasDocument,
  removeNode,
  reorderNode,
  updateNode,
} from '@forme/design-ir'

const parentId = '0d5ee1f7-5039-4e0e-9b12-5ed2d607b707'
const childId = '42110422-7f1d-4acd-9db0-a06a583ae34a'

test('block catalog covers the required primitive, UI, and section families', () => {
  const ids = new Set(blockDefinitions.map((block) => block.id))
  for (const id of [
    'text', 'heading', 'paragraph', 'image', 'gif', 'button', 'input', 'divider', 'spacer', 'container', 'stack', 'grid',
    'navbar', 'footer', 'card', 'form', 'search', 'tabs', 'accordion', 'sidebar', 'breadcrumb', 'pagination', 'table', 'list', 'badge', 'avatar', 'alert', 'modal', 'dropdown', 'stats', 'quote', 'logo-cloud',
    'hero-section', 'features-section', 'pricing-section', 'testimonials-section', 'faq-section', 'cta-section', 'gallery-section', 'stats-section', 'team-section', 'contact-section', 'blog-list-section', 'dashboard-header', 'dashboard-sidebar', 'settings-section', 'authentication-section',
  ] as const) assert.equal(ids.has(id), true, `catalog must include ${id}`)
})

test('empty canvas uses the product breakpoint defaults and validates', () => {
  const canvas = createEmptyCanvasDocument()

  assert.deepEqual(canvas.breakpoints, {
    desktop: { width: 1440, height: 'auto' },
    tablet: { width: 768, height: 'auto' },
    mobile: { width: 390, height: 'auto' },
  })
  assert.deepEqual(canvas.rootIds, [])
  assert.deepEqual(parseCanvasDocument(canvas), canvas)
})

test('a node is a placed block instance with stable semantic and responsive data', () => {
  const node = createNodeFromBlock('heading', { id: childId })

  assert.equal(node.id, childId)
  assert.equal(node.blockId, 'heading')
  assert.equal(node.type, 'heading')
  assert.equal(node.label, 'Heading')
  assert.deepEqual(node.children, [])
  assert.equal(node.layouts.desktop?.mode, 'flow')
  assert.equal(node.visibilityByBreakpoint.mobile, true)
})

test('insertNode preserves parent/child identity and updateNode preserves node id', () => {
  const parent = createNodeFromBlock('container', { id: parentId })
  const child = createNodeFromBlock('heading', { id: childId, parentId })
  const withParent = insertNode(createEmptyCanvasDocument(), parent)
  const withChild = insertNode(withParent, child)
  const updated = updateNode(withChild, childId, { label: 'Page title', props: { text: 'A canvas' } })

  assert.deepEqual(updated.rootIds, [parentId])
  assert.deepEqual(updated.nodes[parentId]?.children, [childId])
  assert.equal(updated.nodes[childId]?.parentId, parentId)
  assert.equal(updated.nodes[childId]?.id, childId)
  assert.equal(updated.nodes[childId]?.label, 'Page title')
  assert.deepEqual(updated.nodes[childId]?.props, { text: 'A canvas' })
})

test('updating one breakpoint preserves the other layout overrides', () => {
  const node = createNodeFromBlock('heading', { id: childId })
  const withNode = insertNode(createEmptyCanvasDocument(), node)
  const withTabletOverride = updateNode(withNode, childId, {
    label: node.label,
    props: node.props,
    layouts: {
      desktop: node.layouts.desktop,
      tablet: { ...node.layouts.tablet!, width: 720 },
      mobile: { ...node.layouts.mobile!, width: 390 },
    },
  })
  const movedDesktop = updateNode(withTabletOverride, childId, {
    layouts: { desktop: { ...node.layouts.desktop, mode: 'absolute', x: 24 } },
  })

  assert.equal(movedDesktop.nodes[childId]?.layouts.desktop.x, 24)
  assert.equal(movedDesktop.nodes[childId]?.layouts.tablet?.width, 720)
  assert.equal(movedDesktop.nodes[childId]?.layouts.mobile?.width, 390)
})

test('canvas validation rejects dangling or mismatched hierarchy references', () => {
  const canvas = createEmptyCanvasDocument()
  const invalid = {
    ...canvas,
    rootIds: [parentId],
    nodes: { [parentId]: { ...createNodeFromBlock('container', { id: parentId }), children: [childId] } },
  }

  assert.throws(() => parseCanvasDocument(invalid))
})

test('removeNode removes a subtree and keeps sibling hierarchy intact', () => {
  const parent = createNodeFromBlock('container', { id: parentId })
  const firstChild = createNodeFromBlock('heading', { id: childId, parentId })
  const secondChildId = '80479a1c-2818-467b-8e20-8d4e9d6f5f71'
  const secondChild = createNodeFromBlock('paragraph', { id: secondChildId, parentId })
  const withParent = insertNode(createEmptyCanvasDocument(), parent)
  const withFirstChild = insertNode(withParent, firstChild)
  const withBothChildren = insertNode(withFirstChild, secondChild)
  const result = removeNode(withBothChildren, childId)

  assert.deepEqual(result.rootIds, [parentId])
  assert.deepEqual(result.nodes[parentId]?.children, [secondChildId])
  assert.equal(result.nodes[childId], undefined)
  assert.equal(result.nodes[secondChildId]?.parentId, parentId)
})

test('duplicateNode creates new identities for a parent and its descendants', () => {
  const parent = createNodeFromBlock('container', { id: parentId })
  const child = createNodeFromBlock('heading', { id: childId, parentId })
  const withParent = insertNode(createEmptyCanvasDocument(), parent)
  const withChild = insertNode(withParent, child)
  const ids = ['966031a2-50d4-4e06-8c08-340c6d1a8ad6', 'ef520d4b-0dbe-42d1-a725-f5b3788f83fb']
  const duplicate = duplicateNode(withChild, parentId, () => ids.shift()!)

  assert.notEqual(duplicate.nodeId, parentId)
  assert.equal(duplicate.document.nodes[duplicate.nodeId]?.children.length, 1)
  assert.notEqual(duplicate.document.nodes[duplicate.nodeId]?.children[0], childId)
  assert.equal(duplicate.document.nodes[duplicate.document.nodes[duplicate.nodeId]!.children[0]!]!.parentId, duplicate.nodeId)
  assert.deepEqual(duplicate.document.rootIds, [parentId, duplicate.nodeId])
})

test('reorderNode changes sibling order without changing node identity', () => {
  const heading = createNodeFromBlock('heading', { id: childId })
  const paragraph = createNodeFromBlock('paragraph', { id: '80479a1c-2818-467b-8e20-8d4e9d6f5f71' })
  const withHeading = insertNode(createEmptyCanvasDocument(), heading)
  const withParagraph = insertNode(withHeading, paragraph)
  const reordered = reorderNode(withParagraph, paragraph.id, -1)

  assert.deepEqual(reordered.rootIds, [paragraph.id, heading.id])
  assert.equal(reordered.nodes[paragraph.id]?.id, paragraph.id)
})

test('custom blocks snapshot a node subtree and can be reused with fresh identities', () => {
  const parent = createNodeFromBlock('container', { id: parentId, label: 'Feature group' })
  const child = createNodeFromBlock('heading', { id: childId, parentId, label: 'Feature title' })
  const withParent = insertNode(createEmptyCanvasDocument(), parent)
  const source = insertNode(withParent, child)
  const customId = '342e02fa-95ef-43d3-b119-54e79885cd80'
  const saved = createCustomBlockFromNode(source, parentId, 'Feature hero', customId)
  const nextRootId = '2a4c83af-d331-45bb-80c0-7d72eb299f88'
  const nextChildId = 'f0fb2380-0a31-4c36-b5ec-219b164ed1ef'
  const reused = instantiateCustomBlock(saved.document, customId, {
    idMap: { [parentId]: nextRootId, [childId]: nextChildId },
  })

  assert.equal(saved.block.name, 'Feature hero')
  assert.equal(saved.document.nodes[parentId]?.id, parentId)
  assert.equal(reused.nodeId, nextRootId)
  assert.notEqual(reused.document.nodes[nextRootId]?.id, parentId)
  assert.equal(reused.document.nodes[nextRootId]?.customBlockId, customId)
  assert.deepEqual(reused.document.nodes[nextRootId]?.children, [nextChildId])
  assert.equal(reused.document.nodes[nextChildId]?.parentId, nextRootId)
  assert.equal(reused.document.nodes[nextChildId]?.label, 'Feature title')
  assert.deepEqual(reused.document.rootIds, [parentId, nextRootId])

  const replay = instantiateCustomBlock(reused.document, customId, {
    idMap: { [parentId]: nextRootId, [childId]: nextChildId },
  })
  assert.equal(replay.replayed, true)
  assert.equal(replay.document.nodes[nextRootId]?.id, nextRootId)
})
