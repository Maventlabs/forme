import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode } from '@forme/design-ir'
import { applyScopedAIEdit, parseAIEditOperations } from './ai-edit'

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

  const image = createNodeFromBlock('image', { label: 'Hero image' })
  const canvas = insertNode(createEmptyCanvasDocument(), image)
  const operations = parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"replace me"}]}')
  assert.throws(() => applyScopedAIEdit(canvas, image.id, operations))
})
