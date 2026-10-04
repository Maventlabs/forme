export const allowedAssetMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'text/markdown',
  'text/plain',
  'application/json',
] as const

export type AllowedAssetMimeType = typeof allowedAssetMimeTypes[number]

export const maxAssetBytes = {
  image: 8 * 1024 * 1024,
  document: 2 * 1024 * 1024,
} as const

export const MAX_ASSET_BYTES = maxAssetBytes.image

const EXTENSION_BY_MIME: Record<AllowedAssetMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'application/json': 'json',
}

export function isAllowedAssetMimeType(value: string): value is AllowedAssetMimeType {
  return (allowedAssetMimeTypes as readonly string[]).includes(value)
}

export function assetKind(mimeType: AllowedAssetMimeType) {
  return mimeType.startsWith('image/') ? 'image' : 'document'
}

export function maxBytesForMimeType(mimeType: AllowedAssetMimeType) {
  return assetKind(mimeType) === 'image' ? maxAssetBytes.image : maxAssetBytes.document
}

/**
 * SVG and other text formats can carry active content, so they are rejected by
 * default unless the deployment explicitly opts in. Everything else is limited
 * to an allowlist of inert media/document types.
 */
export function isSafeAssetMimeType(mimeType: AllowedAssetMimeType) {
  return mimeType !== 'image/svg+xml'
}

const UNSAFE_KEY_SEGMENT = /[^a-zA-Z0-9._-]/

/**
 * Build a collision-resistant, traversal-free object key.
 * The key is derived server-side from the owner/project ids and a random id,
 * never from the user-supplied filename, and the original filename is only
 * stored as sanitized metadata.
 */
export function buildAssetObjectKey(input: {
  ownerId: string
  projectId: string
  assetId: string
  mimeType: AllowedAssetMimeType
}) {
  const ownerSegment = UNSAFE_KEY_SEGMENT.test(input.ownerId) ? 'owner' : input.ownerId.slice(0, 64)
  const projectSegment = UNSAFE_KEY_SEGMENT.test(input.projectId) ? 'project' : input.projectId.slice(0, 64)
  const assetSegment = UNSAFE_KEY_SEGMENT.test(input.assetId) ? 'asset' : input.assetId.slice(0, 64)
  const extension = EXTENSION_BY_MIME[input.mimeType]
  return `forme/${ownerSegment}/${projectSegment}/${assetSegment}.${extension}`
}

export function sanitizeAssetFileName(input: string) {
  const base = input.split(/[\\/]/).pop() ?? 'upload'
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, '').trim().slice(0, 120)
  return cleaned.length > 0 ? cleaned : 'upload'
}

export type AssetUploadRequest = {
  objectKey: string
  contentType: AllowedAssetMimeType
  contentLength: number
  sha256: string
}

export type PresignedUpload = {
  method: 'PUT'
  url: string
  headers: Record<string, string>
  expiresInSeconds: number
}

export type StoredObject = {
  objectKey: string
  contentType: string
  contentLength: number
  etag?: string
}

/**
 * Vendor-neutral object storage contract. FORME never hardcodes one vendor:
 * any S3-compatible implementation satisfies this interface.
 */
export interface FormeObjectStorage {
  createUploadUrl(request: AssetUploadRequest): Promise<PresignedUpload>
  headObject(objectKey: string): Promise<StoredObject | null>
  deleteObject(objectKey: string): Promise<void>
}