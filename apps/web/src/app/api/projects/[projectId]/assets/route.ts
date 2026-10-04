import { z } from 'zod'
import { prepareAssetUpload, registerAsset } from '@/lib/asset-service'
import { isAllowedAssetMimeType, MAX_ASSET_BYTES } from '@/lib/storage/storage-types'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { getRequestId, providerJson } from '@/lib/provider-http'
import { checkInProcessRate, rateLimitRules } from '@/lib/rate-limit'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

const MAX_UPLOAD_BYTES = MAX_ASSET_BYTES + 64 * 1024

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  try {
    const { listProjectAssets } = await import('@/lib/asset-service')
    const items = await listProjectAssets(session.user.id, projectId)
    return providerJson({ assets: items })
  } catch {
    return providerJson({ error: 'ASSETS_UNAVAILABLE' }, 503)
  }
}

const prepareUploadInputSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
}).strict()

export async function POST(request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/assets', reason: invalidMutation.status }, requestId)
    return invalidMutation
  }
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/projects/:id/assets' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }
  const { projectId } = await params

  const rateLimit = checkInProcessRate(rateLimitRules.assetPrepare, session.user.id)
  if (!rateLimit.allowed) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/assets', reason: 'rate_limited' }, requestId)
    return providerJson({ error: 'RATE_LIMITED', retryAfterSeconds: rateLimit.retryAfterSeconds }, 429)
  }

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = prepareUploadInputSchema.safeParse(body.value)
  if (!input.success) return providerJson({ error: 'INVALID_ASSET_REQUEST' }, 422)

  // Reject unsupported content types before any credential or storage work.
  if (!isAllowedAssetMimeType(input.data.mimeType)) return providerJson({ error: 'ASSET_TYPE_NOT_ALLOWED' }, 422)

  try {
    const preparation = await prepareAssetUpload({
      ownerId: session.user.id,
      projectId,
      fileName: input.data.fileName,
      mimeType: input.data.mimeType,
      byteSize: input.data.byteSize,
      sha256: input.data.sha256,
    })

    await registerAsset({
      ownerId: session.user.id,
      projectId,
      assetId: preparation.assetId,
      objectKey: preparation.objectKey,
      fileName: input.data.fileName,
      mimeType: input.data.mimeType as never,
      byteSize: input.data.byteSize,
      sha256: input.data.sha256 ?? '',
    })

    log.info('storage.upload_prepared', { projectId, assetId: preparation.assetId, byteSize: input.data.byteSize }, requestId)

    return providerJson({
      asset: { id: preparation.assetId, status: 'pending' },
      upload: { url: preparation.uploadUrl, headers: preparation.headers, expiresInSeconds: preparation.expiresInSeconds },
    }, 201)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ASSET_UPLOAD_FAILED'
    log.warn('storage.upload_failed', { projectId, code }, requestId)
    if (code === 'PROJECT_NOT_FOUND') return providerJson({ error: code }, 404)
    if (code === 'STORAGE_UNAVAILABLE') return providerJson({ error: code }, 503)
    if (code.startsWith('ASSET_')) return providerJson({ error: code }, 422)
    return providerJson({ error: 'ASSET_UPLOAD_FAILED' }, 503)
  }
}