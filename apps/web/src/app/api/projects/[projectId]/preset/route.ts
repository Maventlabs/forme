import { z } from 'zod'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { applyDesignTokens, tokensFromPreset } from '@/lib/design-apply'
import { designPresets, findDesignPreset } from '@/lib/design-presets'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { checkInProcessRate, rateLimitRules } from '@/lib/rate-limit'
import { getRequestId, providerFailure, providerJson } from '@/lib/provider-http'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

  // The catalog is global product content, but this endpoint is project-scoped,
  // so it must not confirm the existence of another owner's project.
  try {
    const project = await getOwnedProjectCanvas(projectId, session.user.id)
    if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
  } catch {
    return providerJson({ error: 'PROJECT_UNAVAILABLE' }, 503)
  }

  return providerJson({ presets: designPresets.map(({ id, name, description, density, spacingUnit }) => ({ id, name, description, density, spacingUnit })) })
}

const applyPresetInputSchema = z.object({
  presetId: z.string().trim().min(1).max(64),
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export async function POST(request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/preset', reason: invalidMutation.status }, requestId)
    return invalidMutation
  }
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/projects/:id/preset' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }
  const { projectId } = await params

  const rateLimit = checkInProcessRate(rateLimitRules.presetApply, session.user.id)
  if (!rateLimit.allowed) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/preset', reason: 'rate_limited' }, requestId)
    return providerJson({ error: 'RATE_LIMITED', retryAfterSeconds: rateLimit.retryAfterSeconds }, 429)
  }

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const input = applyPresetInputSchema.safeParse(body.value)
  if (!input.success) return providerJson({ error: 'INVALID_PRESET_REQUEST' }, 422)

  const preset = findDesignPreset(input.data.presetId)
  if (!preset) return providerJson({ error: 'PRESET_NOT_FOUND' }, 404)

  try {
    const project = await getOwnedProjectCanvas(projectId, session.user.id)
    if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
    if (project.revision !== input.data.expectedRevision) {
      return providerJson({ error: 'REVISION_CONFLICT', revision: project.revision }, 409)
    }

    const canvas = applyDesignTokens(project.canvas, tokensFromPreset(preset), `forme:preset/${preset.id}`)
    const revision = await saveOwnedProjectCanvas({
      projectId,
      userId: session.user.id,
      expectedRevision: project.revision,
      canvas,
    })
    if (revision === null) return providerJson({ error: 'REVISION_CONFLICT' }, 409)

    log.info('preset.applied', { projectId, presetId: preset.id, revision }, requestId)
    return providerJson({ preset: { id: preset.id, name: preset.name }, revision })
  } catch (error) {
    return providerFailure(error, { operation: 'preset_apply', requestId })
  }
}