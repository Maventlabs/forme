import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument, createNodeFromBlock, insertNode, updateNode } from '@forme/design-ir'
import { summarizeProjectCanvas } from './project-preview'

test('summarizes an empty canvas without inventing preview blocks', () => {
  assert.deepEqual(summarizeProjectCanvas(createEmptyCanvasDocument()), { nodeCount: 0, preview: [] })
})

test('summarizes only visible desktop nodes and caps thumbnail detail', () => {
  let canvas = createEmptyCanvasDocument()
  for (let index = 0; index < 14; index += 1) {
    const blockId = index === 0 ? 'heading' : index === 1 ? 'image' : 'paragraph'
    const node = createNodeFromBlock(blockId)
    canvas = insertNode(canvas, node)
  }
  const hiddenNodeId = canvas.rootIds[1]!
  canvas = updateNode(canvas, hiddenNodeId, {
    visibilityByBreakpoint: { desktop: false, tablet: true, mobile: true },
  })

  const summary = summarizeProjectCanvas(canvas)
  assert.equal(summary.nodeCount, 14)
  assert.equal(summary.preview.length, 8)
  assert.equal(summary.preview[0]?.kind, 'heading')
  assert.ok(summary.preview.every((item) => item.kind !== 'media'), 'desktop-hidden media must not appear in the preview')
})

test('rejects invalid persisted canvas data instead of reporting an empty project', () => {
  assert.throws(() => summarizeProjectCanvas({ nodes: {}, rootIds: [] }))
})
