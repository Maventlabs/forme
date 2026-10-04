import assert from 'node:assert/strict'
import test from 'node:test'
import { REDACTED, redactForLog, redactString } from './observability/redact'
import { checkInProcessRate, rateLimitRules, resetInProcessRateForTests } from './rate-limit'

test('redacts credentials by value shape regardless of key name', () => {
  const output = redactForLog({
    note: 'using AIzaSyDUMMYKEYDUMMYKEYDUMMYKEY1234567890abcdef',
    other: 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345',
    connection: 'postgresql://user:supersecretpassword@db.example.com:5432/forme',
  }) as Record<string, string>

  assert.ok(!output.note!.includes('AIza'), 'Google-style API keys must be redacted')
  assert.ok(!output.other!.includes('abcdefghijklmnopqrstuvwxyz'), 'bearer tokens must be redacted')
  assert.ok(!output.connection!.includes('supersecretpassword'), 'connection string passwords must be redacted')
  assert.ok(output.note!.includes(REDACTED))
})

test('redacts secret-looking keys wholesale', () => {
  const output = redactForLog({
    apiKey: 'plain-value-that-would-leak',
    providerApiKey: 'another-secret',
    authorization: 'Bearer xyz',
    password: 'hunter2',
    sessionId: 'session-abc',
    safeField: 'keep me',
  }) as Record<string, string>

  for (const key of ['apiKey', 'providerApiKey', 'authorization', 'password', 'sessionId']) {
    assert.equal(output[key], REDACTED, `${key} must be redacted`)
  }
  assert.equal(output.safeField, 'keep me')
})

test('redacts nested structures and errors without losing diagnosis value', () => {
  const output = redactForLog({
    provider: 'google-gemini',
    nested: { attempt: [{ apiKey: 'leak-me' }, 'ok'] },
    failure: Object.assign(new Error('upstream rejected apiKey=sk-leakvalue1234567890'), { code: 'INVALID_CREDENTIAL' }),
  }) as { provider: string; nested: { attempt: Array<Record<string, string> | string> }; failure: { name: string; message: string; code: string } }

  assert.equal(output.provider, 'google-gemini', 'non-secret context must survive for diagnosis')
  assert.deepEqual(output.nested.attempt[0], { apiKey: REDACTED })
  assert.equal(output.nested.attempt[1], 'ok', 'non-secret array entries must survive')
  assert.equal(output.failure.code, 'INVALID_CREDENTIAL', 'error codes stay available for diagnosis')
  assert.ok(!output.failure.message.includes('sk-leakvalue'))
})

test('bounds log payloads so a large body cannot flood the log stream', () => {
  const output = redactForLog({ long: 'x'.repeat(5_000), many: Array.from({ length: 50 }, (_, i) => i) }) as { long: string; many: unknown[] }
  assert.ok(output.long.length < 600, 'long strings must be truncated')
  assert.ok(output.many.length <= 21, 'large arrays must be summarised')
})

test('redactString leaves ordinary text intact', () => {
  assert.equal(redactString('FORME wireframe export for revision 7'), 'FORME wireframe export for revision 7')
})

test('in-process rate limit blocks after the configured burst and recovers after the window', () => {
  resetInProcessRateForTests()
  const rule = rateLimitRules.exportGenerate
  const identity = 'user-test'

  for (let index = 0; index < rule.limit; index += 1) {
    assert.equal(checkInProcessRate(rule, identity).allowed, true, `request ${index + 1} must be allowed`)
  }

  const blocked = checkInProcessRate(rule, identity)
  assert.equal(blocked.allowed, false, 'the burst beyond the limit must be blocked')
  assert.ok(blocked.retryAfterSeconds > 0, 'a blocked caller must learn when to retry')
  assert.equal(blocked.remaining, 0)

  const otherIdentity = checkInProcessRate(rule, 'another-user')
  assert.equal(otherIdentity.allowed, true, 'one user must never exhaust another user’s budget')

  const otherAction = checkInProcessRate(rateLimitRules.shareCreate, identity)
  assert.equal(otherAction.allowed, true, 'rate limits must be scoped per action')
  resetInProcessRateForTests()
})