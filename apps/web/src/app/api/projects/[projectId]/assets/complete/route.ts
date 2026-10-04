import { z } from 'zod'
import { confirmAssetUpload } from '@/lib/asset-service'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const completeUploadInputSchema = z.object({
  assetId: z.string().uuid(),
}).strict()

export async function POST(request: Request) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = completeUploadInputSchema.safeParse(body.value)
  if (!input.success) return providerJson({ error: 'INVALID_ASSET_REQUEST' }, 422)

  try {
    const asset = await confirmAssetUpload({ ownerId: session.user.id, assetId: input.data.assetId })
    if (!asset) return providerJson({ error: 'ASSET_NOT_FOUND' }, 404)
    return providerJson({ asset })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ASSET_CONFIRM_FAILED'
    if (code === 'ASSET_NOT_FOUND') return providerJson({ error: code }, 404)
    if (code === 'ASSET_OBJECT_MISSING') return providerJson({ error: code }, 409)
    if (code === 'STORAGE_UNAVAILABLE') return providerJson({ error: code }, 503)
    return providerJson({ error: 'ASSET_CONFIRM_FAILED' }, 503)
  }
}