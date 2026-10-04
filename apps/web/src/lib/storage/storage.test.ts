import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assetKind,
  buildAssetObjectKey,
  isAllowedAssetMimeType,
  isSafeAssetMimeType,
  maxBytesForMimeType,
  sanitizeAssetFileName,
} from './storage-types'
import { presignPutObject, readS3StorageConfig, resetObjectStorageForTests, getObjectStorage } from './s3-storage'

test('asset type allowlist rejects unknown and active content types', () => {
  assert.equal(isAllowedAssetMimeType('image/png'), true)
  assert.equal(isAllowedAssetMimeType('application/x-msdownload'), false)
  assert.equal(isAllowedAssetMimeType('text/html'), false)
  assert.equal(isSafeAssetMimeType('image/svg+xml'), false, 'SVG can carry script and must be rejected by default')
  assert.equal(isSafeAssetMimeType('image/png'), true)
  assert.equal(assetKind('image/webp'), 'image')
  assert.equal(assetKind('text/markdown'), 'document')
  assert.ok(maxBytesForMimeType('image/png') > maxBytesForMimeType('text/markdown'))
})

test('object keys are traversal-free and never derived from user filenames', () => {
  const key = buildAssetObjectKey({ ownerId: 'user-1', projectId: 'proj-1', assetId: 'asset-1', mimeType: 'image/png' })
  assert.equal(key, 'forme/user-1/proj-1/asset-1.png')
  assert.ok(!key.includes('..'), 'object key must never contain traversal segments')
  assert.ok(!key.includes('\\'), 'object key must never contain backslashes')

  const hostile = buildAssetObjectKey({ ownerId: '../../etc', projectId: 'p/../x', assetId: 'a b', mimeType: 'image/jpeg' })
  assert.ok(!hostile.includes('..'))
  assert.ok(!hostile.includes(' '))
  assert.match(hostile, /^forme\/[a-z]+\/[a-z]+\/[a-z]+\.jpg$/)
})

test('uploaded filenames are sanitized before being stored as metadata', () => {
  assert.equal(sanitizeAssetFileName('../../secret.txt'), 'secret.txt')
  assert.equal(sanitizeAssetFileName('C:\\temp\\pic.png'), 'pic.png')
  assert.equal(sanitizeAssetFileName('   '), 'upload')
  assert.equal(sanitizeAssetFileName('a'.repeat(300)).length, 120)
})

test('S3 configuration is read only when complete and safe', () => {
  assert.equal(readS3StorageConfig({} as unknown as NodeJS.ProcessEnv), null)
  assert.equal(readS3StorageConfig({ S3_BUCKET: 'b', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's' } as unknown as NodeJS.ProcessEnv), null)
  const insecure = readS3StorageConfig({
    S3_ENDPOINT: 'http://example.com', S3_BUCKET: 'b', S3_ACCESS_KEY_ID: 'k', S3_SECRET_ACCESS_KEY: 's',
  } as unknown as NodeJS.ProcessEnv)
  assert.equal(insecure, null, 'plain HTTP endpoints must be rejected outside localhost')

  const config = readS3StorageConfig({
    S3_ENDPOINT: 'https://s3.example.com/', S3_BUCKET: 'assets', S3_ACCESS_KEY_ID: 'key', S3_SECRET_ACCESS_KEY: 'secret',
  } as unknown as NodeJS.ProcessEnv)
  assert.equal(config?.endpoint, 'https://s3.example.com')
  assert.equal(config?.presignTtlSeconds, 900)
  assert.equal(config?.region, 'auto')
})

test('presigned PUT URLs are deterministic, scoped, and never leak the secret key', () => {
  const config = readS3StorageConfig({
    S3_ENDPOINT: 'https://s3.example.com', S3_BUCKET: 'assets', S3_ACCESS_KEY_ID: 'AKIAEXAMPLE', S3_SECRET_ACCESS_KEY: 'super-secret-value',
  } as unknown as NodeJS.ProcessEnv)!
  const now = new Date('2026-09-27T10:00:00.000Z')
  const request = { objectKey: 'forme/u/p/a.png', contentType: 'image/png' as const }

  const first = presignPutObject(config, request, { now })
  const second = presignPutObject(config, request, { now })
  assert.equal(first.url, second.url, 'the same request and instant must produce the same signature')
  assert.ok(first.url.startsWith('https://s3.example.com/assets/forme/u/p/a.png?'), 'URL must target the bucket and object key')
  assert.match(first.url, /X-Amz-Algorithm=AWS4-HMAC-SHA256/)
  assert.match(first.url, /X-Amz-Expires=900/)
  assert.match(first.url, /X-Amz-Signature=[0-9a-f]{64}/)
  assert.equal(first.headers['content-type'], 'image/png')
  assert.ok(!first.url.includes('super-secret-value'), 'the secret access key must never appear in the URL')

  const later = presignPutObject(config, request, { now: new Date('2026-09-27T10:01:00.000Z') })
  assert.notEqual(later.url, first.url, 'a different instant must produce a different signature')

  const otherKey = presignPutObject(config, { ...request, objectKey: 'forme/u/p/b.png' }, { now })
  assert.notEqual(otherKey.url, first.url, 'a different object key must produce a different signature')
})

test('object storage fails honestly when no durable backend is configured', () => {
  resetObjectStorageForTests()
  const previous = process.env.S3_BUCKET
  delete process.env.S3_BUCKET
  assert.equal(getObjectStorage(), null, 'unconfigured storage must return null rather than a fake store')
  if (previous !== undefined) process.env.S3_BUCKET = previous
  resetObjectStorageForTests()
})