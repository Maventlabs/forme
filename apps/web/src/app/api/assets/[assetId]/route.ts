import { mutationFailureResponse } from '@/lib/http-json'
import { deleteAsset } from '@/lib/asset-service'
import { getServerSession } from '@/lib/server-session'
import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ assetId: string }> }

export async function DELETE(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request, false)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { assetId } = await params

  try {
    const deleted = await deleteAsset(session.user.id, assetId)
    if (!deleted) return providerJson({ error: 'ASSET_NOT_FOUND' }, 404)
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
  } catch {
    return providerJson({ error: 'ASSET_DELETE_FAILED' }, 503)
  }
}