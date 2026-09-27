import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmptyCanvasDocument } from '@forme/design-ir'
import { createCanvasStore } from '../app/workspace/[projectId]/canvas-store'

test('canvas store queues durable edits and preserves history across undo/redo', () => {
  const store = createCanvasStore(createEmptyCanvasDocument(), 0)
  const nodeId = store.getState().addBlock('heading')

  assert.equal(store.getState().document.nodes[nodeId]?.label, 'Heading')
  assert.equal(store.getState().operations[0]?.kind, 'create')
  store.getState().completeOperation(store.getState().operations[0]!.id, 1)

  store.getState().editNode(nodeId, { label: 'Page title', props: { text: 'A clear title' } })
  assert.equal(store.getState().document.nodes[nodeId]?.label, 'Page title')
  assert.equal(store.getState().saveState, 'dirty')
  store.getState().completeOperation(store.getState().operations[0]!.id, 2)

  store.getState().undo()
  assert.equal(store.getState().document.nodes[nodeId]?.label, 'Heading')
  assert.equal(store.getState().operations[0]?.kind, 'replace')
  store.getState().completeOperation(store.getState().operations[0]!.id, 3)

  store.getState().redo()
  assert.equal(store.getState().document.nodes[nodeId]?.label, 'Page title')
  assert.equal(store.getState().operations[0]?.kind, 'replace')
})

test('canvas store applies a local node delete and queues persistence', () => {
  const store = createCanvasStore(createEmptyCanvasDocument(), 0)
  const nodeId = store.getState().addBlock('paragraph')
  const createOperation = store.getState().operations[0]!
  store.getState().completeOperation(createOperation.id, 1)

  store.getState().deleteNode(nodeId)

  assert.equal(store.getState().document.nodes[nodeId], undefined)
  assert.equal(store.getState().operations[0]?.kind, 'delete')
})

test('canvas store saves and instantiates a reusable custom block', () => {
  const store = createCanvasStore(createEmptyCanvasDocument(), 0)
  const sourceId = store.getState().addBlock('card')
  store.getState().completeOperation(store.getState().operations[0]!.id, 1)
  const customBlockId = store.getState().saveNodeAsCustomBlock(sourceId, 'Feature card')

  assert.equal(store.getState().document.customBlocks[customBlockId]?.name, 'Feature card')
  assert.equal(store.getState().operations[0]?.kind, 'create-custom-block')
  store.getState().completeOperation(store.getState().operations[0]!.id, 2)

  const instanceId = store.getState().instantiateCustomBlock(customBlockId)
  assert.notEqual(instanceId, sourceId)
  assert.equal(store.getState().document.nodes[instanceId]?.customBlockId, customBlockId)
  assert.equal(store.getState().operations[0]?.kind, 'instantiate-custom-block')
})
