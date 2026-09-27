import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAnthropicModels } from './anthropic-provider'

test('normalizes Anthropic model records without a permanent catalog', () => {
  assert.deepEqual(normalizeAnthropicModels({ data: [{ id: 'claude-test', display_name: 'Claude Test' }] }), [{
    id: 'claude-test',
    displayName: 'Claude Test',
    description: '',
    capabilities: ['text-generation'],
    status: 'discovered',
  }])
  assert.throws(() => normalizeAnthropicModels({ data: 'nope' }))
})
