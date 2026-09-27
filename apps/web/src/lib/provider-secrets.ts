import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto'

const ivBytes = 12
const tagBytes = 16

function activeKeyId() {
  const keyId = process.env.PROVIDER_SECRET_ENCRYPTION_KEY_ID?.trim() || 'v1'
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(keyId)) throw new Error('PROVIDER_ENCRYPTION_KEY_ID_INVALID')
  return keyId
}

function decodeKey(encoded: string | undefined) {
  if (!encoded) throw new Error('PROVIDER_ENCRYPTION_KEY_MISSING')
  const key = Buffer.from(encoded, 'base64url')
  if (key.length !== 32 || key.toString('base64url') !== encoded) throw new Error('PROVIDER_ENCRYPTION_KEY_INVALID')
  return key
}

function masterKey(keyId = activeKeyId()) {
  const encoded = process.env.PROVIDER_SECRET_ENCRYPTION_KEY
  if (keyId === activeKeyId()) return decodeKey(encoded)
  const keyringText = process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING
  if (!keyringText) throw new Error('PROVIDER_ENCRYPTION_KEY_VERSION_UNAVAILABLE')
  let keyring: unknown
  try {
    keyring = JSON.parse(keyringText)
  } catch {
    throw new Error('PROVIDER_ENCRYPTION_KEYRING_INVALID')
  }
  if (!keyring || typeof keyring !== 'object' || Array.isArray(keyring)) throw new Error('PROVIDER_ENCRYPTION_KEYRING_INVALID')
  const archivedKey = (keyring as Record<string, unknown>)[keyId]
  if (typeof archivedKey !== 'string') throw new Error('PROVIDER_ENCRYPTION_KEY_VERSION_UNAVAILABLE')
  return decodeKey(archivedKey)
}

function encryptionKey(keyId = activeKeyId()) {
  return Buffer.from(hkdfSync('sha256', masterKey(keyId), Buffer.alloc(0), Buffer.from(`forme:provider-secret-encryption:${keyId}`), 32))
}

export function assertProviderEncryptionConfigured() {
  masterKey(activeKeyId())
  const keyringText = process.env.PROVIDER_SECRET_ENCRYPTION_KEYRING
  if (keyringText) {
    let keyring: unknown
    try {
      keyring = JSON.parse(keyringText)
    } catch {
      throw new Error('PROVIDER_ENCRYPTION_KEYRING_INVALID')
    }
    if (!keyring || typeof keyring !== 'object' || Array.isArray(keyring)) throw new Error('PROVIDER_ENCRYPTION_KEYRING_INVALID')
    for (const value of Object.values(keyring)) {
      if (typeof value !== 'string') throw new Error('PROVIDER_ENCRYPTION_KEYRING_INVALID')
      decodeKey(value)
    }
  }
}

export function fingerprintProviderRequest(value: string) {
  const keyId = activeKeyId()
  const key = Buffer.from(hkdfSync('sha256', masterKey(keyId), Buffer.alloc(0), Buffer.from(`forme:generation-request-fingerprint:${keyId}`), 32))
  const digest = createHmac('sha256', key).update(value).digest('hex')
  return `${keyId}.${digest}`
}

export function providerRequestFingerprintMatches(value: string, fingerprint: string) {
  const separator = fingerprint.indexOf('.')
  if (separator < 1) return false
  const keyId = fingerprint.slice(0, separator)
  const storedDigest = fingerprint.slice(separator + 1)
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(keyId) || !/^[0-9a-f]{64}$/.test(storedDigest)) return false
  try {
    const key = Buffer.from(hkdfSync('sha256', masterKey(keyId), Buffer.alloc(0), Buffer.from(`forme:generation-request-fingerprint:${keyId}`), 32))
    const currentDigest = createHmac('sha256', key).update(value).digest()
    return timingSafeEqual(currentDigest, Buffer.from(storedDigest, 'hex'))
  } catch {
    return false
  }
}

function additionalData(context: { ownerId: string; provider: string }, keyId: string) {
  return Buffer.from(`forme:provider-secret:v1:${keyId}:${context.ownerId}:${context.provider}`)
}

function decodeBase64url(value: string) {
  const bytes = Buffer.from(value, 'base64url')
  if (bytes.toString('base64url') !== value) throw new Error('PROVIDER_SECRET_ENVELOPE_INVALID')
  return bytes
}

export function encryptProviderSecret(secret: string, context: { ownerId: string; provider: string }) {
  if (!secret || secret.length > 8_192) throw new Error('PROVIDER_SECRET_INVALID')
  const keyId = activeKeyId()
  const iv = randomBytes(ivBytes)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(keyId), iv, { authTagLength: tagBytes })
  cipher.setAAD(additionalData(context, keyId))
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', keyId, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function decryptProviderSecret(envelope: string, context: { ownerId: string; provider: string }) {
  const [version, keyId, encodedIv, encodedTag, encodedCiphertext, extra] = envelope.split('.')
  if (version !== 'v1' || !keyId || !/^[A-Za-z0-9_-]{1,32}$/.test(keyId) || !encodedIv || !encodedTag || encodedCiphertext === undefined || extra !== undefined) {
    throw new Error('PROVIDER_SECRET_ENVELOPE_INVALID')
  }

  const iv = decodeBase64url(encodedIv)
  const tag = decodeBase64url(encodedTag)
  const ciphertext = decodeBase64url(encodedCiphertext)
  if (iv.length !== ivBytes || tag.length !== tagBytes) throw new Error('PROVIDER_SECRET_ENVELOPE_INVALID')

  try {
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(keyId), iv, { authTagLength: tagBytes })
    decipher.setAAD(additionalData(context, keyId))
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    throw new Error('PROVIDER_SECRET_DECRYPT_FAILED')
  }
}
