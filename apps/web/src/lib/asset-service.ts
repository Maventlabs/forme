import { createHash, randomUUID } from 'node:crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '@/db'
import { assets, projects } from '@/db/schema'
import {
  buildAssetObjectKey,
  isAllowedAssetMimeType,
  isSafeAssetMimeType,
  maxBytesForMimeType,
  sanitizeAssetFileName,
  MAX_ASSET_BYTES,
  type AllowedAssetMimeType,
} from './storage/storage-types'
import { getObjectStorage } from './storage/s3-storage'

export type AssetUploadPreparation = {
  assetId: string
  objectKey: string
  uploadUrl: string
  headers: Record<string, string>
  expiresInSeconds: number
}

/**
 * Prepare a direct browser upload. The object key and asset id are generated
 * server-side; the client only supplies metadata. Nothing is persisted until
 * the object is confirmed to exist in durable storage.
 */
export async function prepareAssetUpload(input: {
  ownerId: string
  projectId: string
  fileName: string
  mimeType: string
  byteSize: number
  sha256?: string
}) {
  if (!isAllowedAssetMimeType(input.mimeType)) throw new Error('ASSET_TYPE_NOT_ALLOWED')
  if (!isSafeAssetMimeType(input.mimeType)) throw new Error('ASSET_TYPE_NOT_ALLOWED')
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) throw new Error('ASSET_SIZE_INVALID')
  if (input.byteSize > Math.min(maxBytesForMimeType(input.mimeType), MAX_ASSET_BYTES)) throw new Error('ASSET_SIZE_INVALID')
  if (input.sha256 !== undefined && !/^[0-9a-f]{64}$/i.test(input.sha256)) throw new Error('ASSET_CHECKSUM_INVALID')

  const storage = getObjectStorage()
  if (!storage) throw new Error('STORAGE_UNAVAILABLE')

  const [owned] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, input.ownerId)))
    .limit(1)
  if (!owned) throw new Error('PROJECT_NOT_FOUND')

  const assetId = randomUUID()
  const objectKey = buildAssetObjectKey({
    ownerId: input.ownerId,
    projectId: input.projectId,
    assetId,
    mimeType: input.mimeType as AllowedAssetMimeType,
  })

  const presigned = await storage.createUploadUrl({
    objectKey,
    contentType: input.mimeType as AllowedAssetMimeType,
    contentLength: input.byteSize,
    sha256: input.sha256 ?? '',
  })

  return {
    assetId,
    objectKey,
    uploadUrl: presigned.url,
    headers: presigned.headers,
    expiresInSeconds: presigned.expiresInSeconds,
  } satisfies AssetUploadPreparation
}

export async function listProjectAssets(ownerId: string, projectId: string) {
  return getDb()
    .select({
      id: assets.id,
      fileName: assets.fileName,
      mimeType: assets.mimeType,
      byteSize: assets.byteSize,
      status: assets.status,
      placeholderNote: assets.placeholderNote,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .innerJoin(projects, eq(projects.id, assets.projectId))
    .where(and(eq(projects.userId, ownerId), eq(assets.projectId, projectId)))
    .orderBy(desc(assets.createdAt))
}

/**
 * Confirm an upload by verifying the object actually exists in durable storage.
 * A row is only marked `ready` when the stored object is really there, so the
 * UI never shows an asset that does not exist.
 */
export async function confirmAssetUpload(input: { ownerId: string; assetId: string }) {
  const storage = getObjectStorage()
  if (!storage) throw new Error('STORAGE_UNAVAILABLE')

  const db = getDb()
  const [owned] = await db
    .select({
      id: assets.id,
      objectKey: assets.objectKey,
      projectId: assets.projectId,
      ownerId: assets.userId,
    })
    .from(assets)
    .innerJoin(projects, eq(projects.id, assets.projectId))
    .where(and(eq(assets.id, input.assetId), eq(projects.userId, input.ownerId)))
    .limit(1)
  if (!owned) throw new Error('ASSET_NOT_FOUND')

  const stored = await storage.headObject(owned.objectKey)
  if (!stored) throw new Error('ASSET_OBJECT_MISSING')

  const [ready] = await db
    .update(assets)
    .set({ status: 'ready', updatedAt: new Date() })
    .where(and(eq(assets.id, owned.id), inArray(assets.status, ['pending', 'ready'])))
    .returning({ id: assets.id, objectKey: assets.objectKey, fileName: assets.fileName, mimeType: assets.mimeType, byteSize: assets.byteSize, status: assets.status, createdAt: assets.createdAt })

  return ready ?? null
}

export async function registerAsset(input: {
  ownerId: string
  projectId: string
  assetId: string
  objectKey: string
  fileName: string
  mimeType: AllowedAssetMimeType
  byteSize: number
  sha256: string
  placeholderNote?: string
}) {
  const [created] = await getDb()
    .insert(assets)
    .values({
      id: input.assetId,
      projectId: input.projectId,
      userId: input.ownerId,
      objectKey: input.objectKey,
      fileName: sanitizeAssetFileName(input.fileName),
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      sha256: input.sha256 ?? createHash('sha256').update(input.objectKey).digest('hex'),
      status: 'pending',
      placeholderNote: input.placeholderNote ?? null,
    })
    .returning({ id: assets.id, objectKey: assets.objectKey, fileName: assets.fileName, mimeType: assets.mimeType, byteSize: assets.byteSize, status: assets.status, createdAt: assets.createdAt })

  return created ?? null
}

/** Remove an asset row and its stored object. Used by delete and by failed-upload cleanup. */
export async function deleteAsset(ownerId: string, assetId: string) {
  const db = getDb()
  const [owned] = await db
    .select({ id: assets.id, objectKey: assets.objectKey })
    .from(assets)
    .innerJoin(projects, eq(projects.id, assets.projectId))
    .where(and(eq(assets.id, assetId), eq(projects.userId, ownerId)))
    .limit(1)
  if (!owned) return false

  const storage = getObjectStorage()
  if (storage) {
    try {
      await storage.deleteObject(owned.objectKey)
    } catch {
      // The row is removed regardless so the owner never keeps an undeletable
      // asset; orphaned objects are recoverable from the storage bucket.
    }
  }
  await db.delete(assets).where(eq(assets.id, owned.id))
  return true
}