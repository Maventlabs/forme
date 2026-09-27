import assert from 'node:assert/strict'
import test from 'node:test'
import { createProjectInput, parseProjectId } from './project-input'

test('createProjectInput trims a valid project name', () => {
  assert.deepEqual(createProjectInput({ name: '  First canvas  ' }), {
    success: true,
    data: { name: 'First canvas' },
  })
})

test('createProjectInput rejects an empty name', () => {
  const result = createProjectInput({ name: '   ' })

  assert.equal(result.success, false)
})

test('createProjectInput rejects names longer than 80 characters', () => {
  const result = createProjectInput({ name: 'x'.repeat(81) })

  assert.equal(result.success, false)
})

test('parseProjectId accepts UUIDs and rejects other path values', () => {
  assert.equal(parseProjectId('c39ef581-3618-4dd5-b6f2-64978b5cbf99').success, true)
  assert.equal(parseProjectId('not-a-project-id').success, false)
})
