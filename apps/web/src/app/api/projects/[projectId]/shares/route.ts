import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { createShareLink, listShareLinks } from '@/lib/share-service'
import { providerJson } from '@/lib/provider-http'

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
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = createShareInputSchema.safeParse(body.value ?? {})
  if (!input.success) return providerJson({ error: 'INVALID_SHARE_REQUEST' }, 422)

  try {
    const created = await createShareLink(session.user.id, projectId, input.data.expiresInDays)
    // The raw token is returned exactly once and is never persisted or logged.
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