import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '@/db'
import { designContexts, projects } from '@/db/schema'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { applyDesignTokens, tokensFromDesignContext } from '@/lib/design-apply'
import { MAX_DESIGN_CONTEXT_BYTES, hasDesignContextRules, parseDesignContext } from '@/lib/design-context-rules'
import { designPresets } from '@/lib/design-presets'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { checkInProcessRate, rateLimitRules } from '@/lib/rate-limit'
import { getRequestId, providerFailure, providerJson } from '@/lib/provider-http'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

const sourceTypeSchema = z.enum(['paste', 'upload', 'manual'])

const saveContextInputSchema = z.object({
  sourceType: sourceTypeSchema,
  content: z.string().min(1).max(MAX_DESIGN_CONTEXT_BYTES),
  fileName: z.string().trim().min(1).max(200).optional(),
  expectedRevision: z.number().int().nonnegative(),
  apply: z.boolean().default(true),
}).strict()

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  try {
    const project = await getOwnedProjectCanvas(projectId, session.user.id)
    if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)

    const contexts = await getDb()
      .select({
        id: designContexts.id,
        sourceType: designContexts.sourceType,
        fileName: designContexts.fileName,
        parsedRules: designContexts.parsedRules,
        isActive: designContexts.isActive,
        appliedAt: designContexts.appliedAt,
        createdAt: designContexts.createdAt,
        updatedAt: designContexts.updatedAt,
      })
      .from(designContexts)
      .where(and(eq(designContexts.projectId, projectId), eq(designContexts.userId, session.user.id)))
      .orderBy(desc(designContexts.createdAt))

    return providerJson({ contexts, presets: designPresets.map(({ id, name, description, density, spacingUnit }) => ({ id, name, description, density, spacingUnit })) })
  } catch {
    return providerJson({ error: 'DESIGN_CONTEXT_UNAVAILABLE' }, 503)
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/design-context', reason: invalidMutation.status }, requestId)
    return invalidMutation
  }
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/projects/:id/design-context' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }
  const { projectId } = await params

  const rateLimit = checkInProcessRate(rateLimitRules.designContextApply, session.user.id)
  if (!rateLimit.allowed) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/design-context', reason: 'rate_limited' }, requestId)
    return providerJson({ error: 'RATE_LIMITED', retryAfterSeconds: rateLimit.retryAfterSeconds }, 429)
  }

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = saveContextInputSchema.safeParse(body.value)
  if (!input.success) return providerJson({ error: 'INVALID_DESIGN_CONTEXT' }, 422)

  const parsedRules = parseDesignContext(input.data.content)
  if (!hasDesignContextRules(parsedRules)) {
    return providerJson({ error: 'DESIGN_CONTEXT_NO_RULES' }, 422)
  }

  try {
    const project = await getOwnedProjectCanvas(projectId, session.user.id)
    if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
    if (project.revision !== input.data.expectedRevision) {
      return providerJson({ error: 'REVISION_CONFLICT', revision: project.revision }, 409)
    }

    const canvas = input.data.apply
      ? applyDesignTokens(project.canvas, tokensFromDesignContext(parsedRules), `forme:design-context/${projectId}`)
      : project.canvas

    let revision = project.revision
    if (input.data.apply) {
      const next = await saveOwnedProjectCanvas({
        projectId,
        userId: session.user.id,
        expectedRevision: project.revision,
        canvas,
      })
      if (next === null) return providerJson({ error: 'REVISION_CONFLICT' }, 409)
      revision = next
    }

    const now = new Date()
    await getDb().transaction(async (transaction) => {
      await transaction.update(designContexts)
        .set({ isActive: false, updatedAt: now })
        .where(and(eq(designContexts.projectId, projectId), eq(designContexts.isActive, true)))
      await transaction.insert(designContexts).values({
        projectId,
        userId: session.user.id,
        sourceType: input.data.sourceType,
        fileName: input.data.fileName ?? null,
        rawContent: input.data.content,
        parsedRules,
        isActive: true,
        ...(input.data.apply ? { appliedAt: now } : {}),
      })
      if (input.data.apply) {
        await transaction.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId))
      }
    })

    log.info('design_context.applied', {
      projectId,
      sourceType: input.data.sourceType,
      applied: input.data.apply,
      revision,
    }, requestId)

    return providerJson({ context: { sourceType: input.data.sourceType, parsedRules }, revision }, 201)
  } catch (error) {
    return providerFailure(error, { operation: 'design_context_apply', requestId })
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const parsed = saveContextInputSchema.safeParse(body.value)
  if (!parsed.success) return providerJson({ error: 'INVALID_DESIGN_CONTEXT' }, 422)

  const parsedRules = parseDesignContext(parsed.data.content)
  if (!hasDesignContextRules(parsedRules)) return providerJson({ error: 'DESIGN_CONTEXT_NO_RULES' }, 422)

  try {
    const active = await getDb()
      .select({ id: designContexts.id })
      .from(designContexts)
      .where(and(eq(designContexts.projectId, projectId), eq(designContexts.userId, session.user.id), eq(designContexts.isActive, true)))
      .limit(1)

    const now = new Date()
    await getDb()
      .update(designContexts)
      .set({ rawContent: parsed.data.content, parsedRules, sourceType: 'manual', updatedAt: now })
      .where(and(
        eq(designContexts.projectId, projectId),
        eq(designContexts.userId, session.user.id),
        ...(active[0] ? [eq(designContexts.id, active[0].id)] : [sql`${designContexts.id} = ${''}`]),
      ))

    if (active[0]) return providerJson({ updated: true, parsedRules })
    return providerJson({ error: 'DESIGN_CONTEXT_NOT_FOUND' }, 404)
  } catch {
    return providerJson({ error: 'DESIGN_CONTEXT_UNAVAILABLE' }, 503)
  }
}