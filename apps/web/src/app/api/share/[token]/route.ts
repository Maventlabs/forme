import { providerJson } from '@/lib/provider-http'
import { resolveSharedProject } from '@/lib/share-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ token: string }> }

/**
 * Public read-only shared project. Returns only the sanitized canvas
 * projection: no owner identity, no provider connections, no generation jobs
 * and no credentials of any kind.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = await params

  try {
    const shared = await resolveSharedProject(token)
    if (!shared) return providerJson({ error: 'SHARE_NOT_FOUND' }, 404)
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