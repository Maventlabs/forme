import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode } from '@forme/design-ir'
import { applyScopedAIEdit, parseAIEditOperations } from './ai-edit'

test('a rejected operation leaves the canonical canvas completely unmodified', () => {
  const heading = createNodeFromBlock('heading', { label: 'Title', props: { text: 'Original' } })
  const canvas = insertNode(createEmptyCanvasDocument(), heading)
  const before = JSON.stringify(canvas)

  // Non-container parent for appendChild.
  assert.throws(() => applyScopedAIEdit(canvas, heading.id, parseAIEditOperations('{"operations":[{"op":"appendChild","blockId":"paragraph"}]}')))
  // Unknown target.
  assert.throws(() => applyScopedAIEdit(canvas, '00000000-0000-4000-8000-000000000000', parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"x"}]}')))
  // Text edit on a non-text target.
  const image = createNodeFromBlock('image', { label: 'Hero' })
  const withImage = insertNode(canvas, image)
  const imageSnapshot = JSON.stringify(withImage)
  assert.throws(() => applyScopedAIEdit(withImage, image.id, parseAIEditOperations('{"operations":[{"op":"setNodeText","text":"x"}]}')))

  assert.equal(JSON.stringify(canvas), before, 'failed operations must not mutate the source document')
  assert.equal(JSON.stringify(withImage), imageSnapshot, 'failed operations must not partially mutate the canvas')
})

test('malformed model output never reaches the canvas', () => {
  const heading = createNodeFromBlock('heading', { label: 'Title', props: { text: 'Original' } })
  const canvas = insertNode(createEmptyCanvasDocument(), heading)
  const before = JSON.stringify(canvas)

  assert.throws(() => parseAIEditOperations('{not json'))
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"setNodeText"}]}'))
  assert.throws(() => parseAIEditOperations('{"operations":[{"op":"dropDatabase"}]}'))

  assert.equal(JSON.stringify(canvas), before)
})