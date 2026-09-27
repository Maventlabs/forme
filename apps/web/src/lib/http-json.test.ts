import assert from 'node:assert/strict'
import test from 'node:test'
import { readJsonBody, validateMutationRequest } from './http-json'

test('accepts only exact-origin JSON mutations', () => {
  const valid = new Request('https://forme.example/api/mutate', {
    method: 'POST',
    headers: { origin: 'https://forme.example', 'content-type': 'application/json; charset=utf-8' },
    body: '{"ok":true}',
  })
  assert.deepEqual(validateMutationRequest(valid, { expectedOrigin: 'https://forme.example' }), { ok: true })

  const crossOrigin = new Request('https://forme.example/api/mutate', {
    method: 'POST',
    headers: { origin: 'https://attacker.example', 'content-type': 'application/json' },
    body: '{"ok":true}',
  })
  assert.deepEqual(validateMutationRequest(crossOrigin, { expectedOrigin: 'https://forme.example' }), {
    ok: false, status: 403, error: 'INVALID_ORIGIN',
  })

  const missingOrigin = new Request('https://forme.example/api/mutate', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  })
  assert.deepEqual(validateMutationRequest(missingOrigin, { expectedOrigin: 'https://forme.example' }), {
    ok: false, status: 403, error: 'INVALID_ORIGIN',
  })
})

test('rejects simple content types for body-bearing authenticated mutations', () => {
  const request = new Request('https://forme.example/api/mutate', {
    method: 'POST',
    headers: { origin: 'https://forme.example', 'content-type': 'text/plain' },
    body: '{"ok":true}',
  })
  assert.deepEqual(validateMutationRequest(request, { expectedOrigin: 'https://forme.example' }), {
    ok: false, status: 415, error: 'JSON_REQUIRED',
  })
})

test('does not require a body content type for a same-origin DELETE', () => {
  const request = new Request('https://forme.example/api/provider', {
    method: 'DELETE', headers: { origin: 'https://forme.example' },
  })
  assert.deepEqual(validateMutationRequest(request, { expectedOrigin: 'https://forme.example', requireJson: false }), { ok: true })
})

test('reads valid JSON and rejects malformed, non-JSON, and oversized bodies', async () => {
  const makeRequest = (body: string, contentType = 'application/json') => new Request('https://forme.example/api/mutate', {
    method: 'POST', headers: { 'content-type': contentType }, body,
  })
  assert.deepEqual(await readJsonBody(makeRequest('{"name":"FORME"}')), { ok: true, value: { name: 'FORME' } })
  assert.deepEqual(await readJsonBody(makeRequest('not-json')), { ok: false, status: 400 })
  assert.deepEqual(await readJsonBody(makeRequest('{}', 'text/plain')), { ok: false, status: 415 })
  assert.deepEqual(await readJsonBody(makeRequest('"' + 'x'.repeat(256 * 1024) + '"')), { ok: false, status: 413 })
})
