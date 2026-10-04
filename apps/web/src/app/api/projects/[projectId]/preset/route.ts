import { z } from 'zod'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { applyDesignTokens, tokensFromPreset } from '@/lib/design-apply'
import { designPresets, findDesignPreset } from '@/lib/design-presets'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getServerSession } from '@/lib/server-session'
import { providerFailure, providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

export async function GET() {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  return providerJson({ presets: designPresets.map(({ id, name, description, density, spacingUnit }) => ({ id, name, description, density, spacingUnit })) })
}

const applyPresetInputSchema = z.object({
  presetId: z.string().trim().min(1).max(64),
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export async function POST(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)
  const { projectId } = await params

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

    return providerJson({ preset: { id: preset.id, name: preset.name }, revision })
  } catch (error) {
    return providerFailure(error)
  }
}