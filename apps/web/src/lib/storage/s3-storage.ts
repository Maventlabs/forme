import { createHash, createHmac } from 'node:crypto'
import {
  type AssetUploadRequest,
  type FormeObjectStorage,
  type PresignedUpload,
} from './storage-types'

// Minimal S3-compatible client (SigV4 presigned PUT + HEAD + DELETE).
// Written against the S3 REST API so any S3-compatible endpoint works; no
// vendor SDK and no extra dependency is introduced.

export type S3StorageConfig = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  /** Optional separate host used for browser-facing presigned URLs. */
  publicEndpoint?: string
  presignTtlSeconds: number
}

export function readS3StorageConfig(env: NodeJS.ProcessEnv = process.env): S3StorageConfig | null {
  const endpoint = env.S3_ENDPOINT?.trim()
  const bucket = env.S3_BUCKET?.trim()
  const accessKeyId = env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = env.S3_SECRET_ACCESS_KEY?.trim()
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null

  let normalizedEndpoint: string
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null
    normalizedEndpoint = url.origin
  } catch {
    return null
  }

  const ttl = Number(env.S3_PRESIGN_TTL_SECONDS ?? 900)
  return {
    endpoint: normalizedEndpoint,
    region: env.S3_REGION?.trim() || 'auto',
    bucket,
    accessKeyId,
    secretAccessKey,
    ...(env.S3_PUBLIC_ENDPOINT?.trim() ? { publicEndpoint: env.S3_PUBLIC_ENDPOINT.trim().replace(/\/$/, '') } : {}),
    presignTtlSeconds: Number.isInteger(ttl) && ttl >= 60 && ttl <= 3_600 ? ttl : 900,
  }
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value, 'utf8').digest()
}

function amzDate(now: Date) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { amzDate: iso, dateStamp: iso.slice(0, 8) }
}

/** RFC 3986 encoding; S3 requires `/` to stay literal in the canonical path. */
function uriEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

export function presignPutObject(
  config: S3StorageConfig,
  request: Pick<AssetUploadRequest, 'objectKey' | 'contentType'>,
  options: { now: Date; expiresInSeconds?: number },
): PresignedUpload {
  const host = new URL(config.publicEndpoint ?? config.endpoint).host
  const expiresInSeconds = options.expiresInSeconds ?? config.presignTtlSeconds
  const { amzDate: timestamp, dateStamp } = amzDate(options.now)
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`

  const canonicalUri = `/${config.bucket}/${request.objectKey.split('/').map(uriEncode).join('/')}`
  const canonicalQuery = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${uriEncode(`${config.accessKeyId}/${credentialScope}`)}`,
    `X-Amz-Date=${timestamp}`,
    `X-Amz-Expires=${expiresInSeconds}`,
    `X-Amz-SignedHeaders=host`,
  ].join('&')

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n')

  const stringToSign = ['AWS4-HMAC-SHA256', timestamp, credentialScope, sha256Hex(canonicalRequest)].join('\n')

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), config.region), 's3'), 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex')

  const base = (config.publicEndpoint ?? config.endpoint).replace(/\/$/, '')
  return {
    method: 'PUT',
    url: `${base}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`,
    headers: { 'content-type': request.contentType },
    expiresInSeconds,
  }
}

export function createS3Storage(config: S3StorageConfig): FormeObjectStorage {
  return {
    async createUploadUrl(request) {
      return presignPutObject(config, request, { now: new Date() })
    },
    async headObject(objectKey) {
      const url = `${config.endpoint}/${config.bucket}/${objectKey.split('/').map(uriEncode).join('/')}`
      const { amzDate: timestamp, dateStamp } = amzDate(new Date())
      const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`
      const canonicalUri = new URL(url).pathname
      const canonicalHeaders = `host:${new URL(url).host}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${timestamp}\n`
      const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
      const canonicalRequest = ['HEAD', canonicalUri, '', canonicalHeaders, signedHeaders, 'UNSIGNED-PAYLOAD'].join('\n')
      const stringToSign = ['AWS4-HMAC-SHA256', timestamp, credentialScope, sha256Hex(canonicalRequest)].join('\n')
      const signingKey = hmac(hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), config.region), 's3'), 'aws4_request')
      const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex')

      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          host: new URL(url).host,
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
          'x-amz-date': timestamp,
          authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        },
        signal: AbortSignal.timeout(10_000),
      })
      if (response.status === 404) return null
      if (!response.ok) throw new Error('STORAGE_HEAD_FAILED')
      return {
        objectKey,
        contentType: response.headers.get('content-type') ?? 'application/octet-stream',
        contentLength: Number(response.headers.get('content-length') ?? 0),
        ...(response.headers.get('etag') ? { etag: response.headers.get('etag')! } : {}),
      }
    },
    async deleteObject(objectKey) {
      const url = `${config.endpoint}/${config.bucket}/${objectKey.split('/').map(uriEncode).join('/')}`
      const response = await fetch(url, {
        method: 'DELETE',
        signal: AbortSignal.timeout(10_000),
      })
      // S3 delete is idempotent; a missing object is already gone.
      if (!response.ok && response.status !== 404) throw new Error('STORAGE_DELETE_FAILED')
    },
  }
}

let cached: FormeObjectStorage | null | undefined

/**
 * Returns the configured storage, or `null` when no durable object storage is
 * configured. Callers must fail honestly in that case: an unavailable storage
 * backend is never silently replaced by a fake in-memory store.
 */
export function getObjectStorage(): FormeObjectStorage | null {
  if (cached !== undefined) return cached
  const config = readS3StorageConfig()
  cached = config ? createS3Storage(config) : null
  return cached
}

export function resetObjectStorageForTests() {
  cached = undefined
}