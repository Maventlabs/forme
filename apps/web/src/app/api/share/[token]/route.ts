import { getRequestId, providerJson } from '@/lib/provider-http'
import { resolveSharedProject } from '@/lib/share-service'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

/**
 * Public read-only shared project. Returns only the sanitized canvas
 * projection: no owner identity, no provider connections, no generation jobs
 * and no credentials of any kind.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const { token } = await params

  try {
    const shared = await resolveSharedProject(token)
    if (!shared) {
      // Unknown, revoked and expired tokens are indistinguishable on purpose.
      log.warn('share.resolved', { outcome: 'not_found' }, requestId)
      return providerJson({ error: 'SHARE_NOT_FOUND' }, 404)
    }
    log.info('share.resolved', { outcome: 'ok', shareId: shared.shareId }, requestId)
    return providerJson({
      share: {
        id: shared.shareId,
        readOnly: true,
        sharedAt: shared.sharedAt,
      },
      project: {
        name: shared.project.name,
        canvas: shared.project.canvas,
      },
    })
  } catch {
    return providerJson({ error: 'SHARE_UNAVAILABLE' }, 503)
  }
}