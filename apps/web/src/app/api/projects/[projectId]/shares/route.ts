import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { createShareLink, listShareLinks } from '@/lib/share-service'
import { checkInProcessRate, rateLimitRules } from '@/lib/rate-limit'
import { getRequestId, providerJson } from '@/lib/provider-http'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

const createShareInputSchema = z.object({
  expiresInDays: z.number().int().min(1).max(90).nullable().default(null),
}).strict()

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  try {
    const [owned] = await getDb()
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
      .limit(1)
    if (!owned) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)

    const shares = await listShareLinks(session.user.id, projectId)
    return providerJson({ shares })
  } catch {
    return providerJson({ error: 'SHARE_LIST_FAILED' }, 503)
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/shares', reason: invalidMutation.status }, requestId)
    return invalidMutation
  }
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/projects/:id/shares' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }
  const { projectId } = await params

  const rateLimit = checkInProcessRate(rateLimitRules.shareCreate, session.user.id)
  if (!rateLimit.allowed) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/shares', reason: 'rate_limited' }, requestId)
    return providerJson({ error: 'RATE_LIMITED', retryAfterSeconds: rateLimit.retryAfterSeconds }, 429)
  }

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = createShareInputSchema.safeParse(body.value ?? {})
  if (!input.success) return providerJson({ error: 'INVALID_SHARE_REQUEST' }, 422)

  try {
    const created = await createShareLink(session.user.id, projectId, input.data.expiresInDays)
    // The raw token is returned exactly once and is never persisted or logged.
    log.info('share.created', { projectId, shareId: created.id, tokenPrefix: created.tokenPrefix, expiresAt: created.expiresAt }, requestId)
    return providerJson({
      share: { id: created.id, token: created.token, tokenPrefix: created.tokenPrefix, expiresAt: created.expiresAt, createdAt: created.createdAt },
      shareUrl: `/share/${created.token}`,
    }, 201)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'SHARE_CREATE_FAILED'
    if (code === 'PROJECT_NOT_FOUND') return providerJson({ error: code }, 404)
    if (code === 'SHARE_EXPIRY_INVALID') return providerJson({ error: code }, 422)
    if (code === 'SHARE_LIMIT_REACHED') return providerJson({ error: code }, 429)
    return providerJson({ error: 'SHARE_CREATE_FAILED' }, 503)
  }
}