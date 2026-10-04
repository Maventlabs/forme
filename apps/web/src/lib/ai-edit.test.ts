import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode } from '@forme/design-ir'
import {
  aiEditOperationsSchema,
  applyScopedAIEdit,
  isAIScopedEditTarget,
  parseAIEditOperations,
} from './ai-edit'

test('parses structured text edits and mutates only the server-selected node', () => {
  const heading = createNodeFromBlock('heading', { label: 'Page title', props: { text: 'Old title' } })
  const paragraph = createNodeFromBlock('paragraph', { label: 'Body', props: { text: 'Unchanged body' } })
  let canvas = insertNode(createEmptyCanvasDocument(), heading)
  canvas = insertNode(canvas, paragraph)

  const operations = parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"A clearer title"}]}')
  const updated = applyScopedAIEdit(canvas, heading.id, operations)

  assert.equal(updated.nodes[heading.id]?.props.text, 'A clearer title')
  assert.equal(updated.nodes[paragraph.id]?.props.text, 'Unchanged body')
  assert.equal(updated.nodes[heading.id]?.id, heading.id)
  assert.deepEqual(updated.rootIds, canvas.rootIds)
})

test('rejects malformed, out-of-scope, and non-text node edits', () => {
  assert.throws(() => parseAIEditOperations('not json'))
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"deleteNode","nodeId":"other"}]}'))
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"ok","nodeId":"other"}]}'))
  assert.throws(() => parseAIEditOperations('{"operations":[]}'))
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"a"},{"op":"setNodeText","text":"b"}]}'))

  const image = createNodeFromBlock('image', { label: 'Hero image' })
  const canvas = insertNode(createEmptyCanvasDocument(), image)
  const operations = parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"replace me"}]}')
  assert.throws(() => applyScopedAIEdit(canvas, image.id, operations), /AI_TARGET_NODE_NOT_TEXT_EDITABLE/)
})

test('appendChild adds exactly one server-named child under the selected container', () => {
  const container = createNodeFromBlock('container', { label: 'Feature group' })
  const sibling = createNodeFromBlock('paragraph', { label: 'Sibling', props: { text: 'Keep me' } })
  let canvas = insertNode(createEmptyCanvasDocument(), container)
  canvas = insertNode(canvas, sibling)

  const operations = parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"heading","label":"New title","text":"Appended heading"}]}')
  const updated = applyScopedAIEdit(canvas, container.id, operations)

  const parent = updated.nodes[container.id]!
  assert.equal(parent.children.length, 1, 'container must gain exactly one child')
  const childId = parent.children[0]!
  const child = updated.nodes[childId]!
  assert.equal(child.type, 'heading')
  assert.equal(child.parentId, container.id)
  assert.equal(child.label, 'New title')
  assert.equal(child.props.text, 'Appended heading')
  assert.notEqual(childId, container.id)

  // Unrelated nodes and root ordering must be untouched.
  assert.equal(updated.nodes[sibling.id]?.props.text, 'Keep me')
  assert.deepEqual(updated.rootIds, canvas.rootIds)
  assert.deepEqual(Object.keys(updated.nodes).length, Object.keys(canvas.nodes).length + 1)
})

test('appendChild preserves deterministic ordering across repeated appends', () => {
  const container = createNodeFromBlock('container', { label: 'List' })
  const canvas = insertNode(createEmptyCanvasDocument(), container)

  const first = applyScopedAIEdit(canvas, container.id, parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"paragraph","text":"one"}]}'))
  const second = applyScopedAIEdit(first, container.id, parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"paragraph","text":"two"}]}'))

  const children = second.nodes[container.id]!.children
  assert.equal(children.length, 2)
  assert.deepEqual(children, first.nodes[container.id]!.children.concat(children[1]))
  assert.deepEqual(children.map((id) => second.nodes[id]?.props.text), ['one', 'two'])
})

test('appendChild rejects non-container parents and unknown block ids', () => {
  const heading = createNodeFromBlock('heading', { label: 'Title' })
  const canvas = insertNode(createEmptyCanvasDocument(), heading)

  assert.throws(
    () => applyScopedAIEdit(canvas, heading.id, parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"paragraph"}]}')),
    /AI_TARGET_NODE_NOT_A_CONTAINER/,
  )
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"not-a-real-block"}]}'))
})

test('appendChild fails closed for a target outside the supplied canvas', () => {
  const container = createNodeFromBlock('container', { label: 'Group' })
  const canvas = insertNode(createEmptyCanvasDocument(), container)
  const operations = parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"paragraph"}]}')

  assert.throws(() => applyScopedAIEdit(canvas, '00000000-0000-4000-8000-000000000000', operations), /AI_TARGET_NODE_NOT_FOUND/)
  assert.equal(Object.keys(canvas.nodes).length, 1, 'canvas must remain unmodified after a rejected operation')
})

test('scoped edit targets include text nodes and containers but not leaf media', () => {
  assert.equal(isAIScopedEditTarget({ type: 'heading' }), true)
  assert.equal(isAIScopedEditTarget({ type: 'container' }), true)
  assert.equal(isAIScopedEditTarget({ type: 'image' }), false)
})

test('schema accepts only the allowlisted operation union', () => {
  assert.equal(aiEditOperationsSchema.safeParse({ operations: [{ op: 'appendChild', blockId: 'card' }] }).success, true)
  assert.equal(aiEditOperationsSchema.safeParse({ operations: [{ op: 'removeNode' }] }).success, false)
  assert.equal(aiEditOperationsSchema.safeParse({ operations: [{ op: 'appendChild', nodeId: 'x' }] }).success, false)
})