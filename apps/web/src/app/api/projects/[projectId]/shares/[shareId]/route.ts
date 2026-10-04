import { mutationFailureResponse } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { revokeShareLink } from '@/lib/share-service'
import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string; shareId: string }> }

export async function DELETE(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request, false)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId, shareId } = await params

  try {
    const revoked = await revokeShareLink(session.user.id, projectId, shareId)
    if (!revoked) return providerJson({ error: 'SHARE_NOT_FOUND' }, 404)
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
  } catch {
    return providerJson({ error: 'SHARE_REVOKE_FAILED' }, 503)
  }
}