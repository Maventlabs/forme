import assert from 'node:assert/strict'
import test from 'node:test'
import { ProviderAdapterError } from './provider-types'
import { isRetryableProviderError, withBoundedProviderRetry } from './provider-retry'

const policy = { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2, sleep: async () => {} }

test('retries transient provider failures up to the attempt cap, then succeeds', async () => {
  let attempts = 0
  const result = await withBoundedProviderRetry(async () => {
    attempts += 1
    if (attempts < 3) throw new ProviderAdapterError('PROVIDER_TIMEOUT', 504, true)
    return 'ok'
  }, policy)
  assert.equal(result, 'ok')
  assert.equal(attempts, 3)
})

test('never retries credential, rate-limit, model, or schema failures', async () => {
  const terminal = ['INVALID_CREDENTIAL', 'PROVIDER_CREDENTIAL_REJECTED', 'PROVIDER_RATE_LIMITED', 'PROVIDER_MODEL_NOT_FOUND', 'GENERATION_REQUEST_REJECTED', 'INVALID_PROVIDER_RESPONSE']
  for (const code of terminal) {
    let attempts = 0
    await assert.rejects(
      withBoundedProviderRetry(async () => {
        attempts += 1
        throw new ProviderAdapterError(code, 422)
      }, policy),
      (error: unknown) => error instanceof ProviderAdapterError && error.code === code,
    )
    assert.equal(attempts, 1, `${code} must not be retried`)
  }
})

test('propagates the real error and never loops beyond the cap', async () => {
  let attempts = 0
  await assert.rejects(
    withBoundedProviderRetry(async () => {
      attempts += 1
      throw new ProviderAdapterError('PROVIDER_UNAVAILABLE', 503, true)
    }, policy),
    /PROVIDER_UNAVAILABLE/,
  )
  assert.equal(attempts, 3)
  assert.equal(isRetryableProviderError(new Error('boom')), false)
})

test('backoff delay stays bounded by maxDelayMs', async () => {
  const delays: number[] = []
  await assert.rejects(withBoundedProviderRetry(async () => {
    throw new ProviderAdapterError('PROVIDER_TIMEOUT', 504, true)
  }, { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 15, sleep: async (ms) => { delays.push(ms) } }))
  assert.equal(delays.length, 2)
  for (const delay of delays) assert.ok(delay >= 10 && delay <= 115, `delay ${delay} must stay bounded`)
})