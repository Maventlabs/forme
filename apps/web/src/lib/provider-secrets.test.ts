import assert from 'node:assert/strict'
import test from 'node:test'
import { decryptProviderSecret, encryptProviderSecret, fingerprintProviderRequest, providerRequestFingerprintMatches } from './provider-secrets'

const ownerId = 'owner-test'
const provider = 'google-gemini'
const secret = 'test-provider-key-never-log'

test('provider secrets round-trip under owner/provider-bound AES-GCM encryption', () => {
  const previous = process.env.PROVIDER_SECRET_ENCRYPTION_KEY
  process.env.PROVIDER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 17).toString('base64url')
  try {
    const envelope = encryptProviderSecret(secret, { ownerId, provider })
    assert.notEqual(envelope, secret)
    assert.equal(envelope.includes(secret), false)
    assert.equal(decryptProviderSecret(envelope, { ownerId, provider }), secret)
  } finally {
    if (previous === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEY = previous
  }
})

test('tampering, wrong owner/provider, and wrong keys fail closed', () => {
  const previous = process.env.PROVIDER_SECRET_ENCRYPTION_KEY
  process.env.PROVIDER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 17).toString('base64url')
  try {
    const envelope = encryptProviderSecret(secret, { ownerId, provider })
    const parts = envelope.split('.')
    const first = parts[3]?.slice(0, 1)
    parts[3] = `${first === 'A' ? 'B' : 'A'}${parts[3]?.slice(1)}`
    assert.throws(() => decryptProviderSecret(parts.join('.'), { ownerId, provider }))
    assert.throws(() => decryptProviderSecret(envelope, { ownerId: 'other-owner', provider }))
    assert.throws(() => decryptProviderSecret(envelope, { ownerId, provider: 'other-provider' }))

    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 18).toString('base64url')
    assert.throws(() => decryptProviderSecret(envelope, { ownerId, provider }))
  } finally {
    if (previous === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEY = previous
  }
})

test('generation fingerprints are stable, secret-keyed, and do not contain prompt text', () => {
  const previous = process.env.PROVIDER_SECRET_ENCRYPTION_KEY
  process.env.PROVIDER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 19).toString('base64url')
  try {
    const prompt = 'Rewrite only the selected heading'
    const first = fingerprintProviderRequest(prompt)
    assert.equal(fingerprintProviderRequest(prompt), first)
    assert.equal(first.includes(prompt), false)
    assert.equal(providerRequestFingerprintMatches(prompt, first), true)
    assert.equal(providerRequestFingerprintMatches(`${prompt}!`, first), false)

    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 20).toString('base64url')
    assert.notEqual(fingerprintProviderRequest(prompt), first)
  } finally {
    if (previous === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEY = previous
  }
})

test('versioned keyring decrypts existing credentials while encrypting with the active key id', () => {
  const previousKey = process.env.PROVIDER_SECRET_ENCRYPTION_KEY
  const previousKeyId = process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID
  const previousKeyring = process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING
  const oldKey = Buffer.alloc(32, 21).toString('base64url')
  const newKey = Buffer.alloc(32, 22).toString('base64url')
  try {
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = oldKey
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID = 'old-v1'
    delete process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING
    const oldEnvelope = encryptProviderSecret(secret, { ownerId, provider })

    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = newKey
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID = 'new-v2'
    process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING = JSON.stringify({ 'old-v1': oldKey })
    assert.equal(decryptProviderSecret(oldEnvelope, { ownerId, provider }), secret)
    const newEnvelope = encryptProviderSecret(secret, { ownerId, provider })
    assert.equal(newEnvelope.split('.')[1], 'new-v2')
    assert.equal(decryptProviderSecret(newEnvelope, { ownerId, provider }), secret)
  } finally {
    if (previousKey === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEY = previousKey
    if (previousKeyId === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID = previousKeyId
    if (previousKeyring === undefined) delete process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING
    else process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING = previousKeyring
  }
})
