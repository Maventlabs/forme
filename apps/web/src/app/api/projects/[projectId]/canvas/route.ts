import { isDeepStrictEqual } from 'node:util'
import { getServerSession } from '@/lib/server-session'
import { parseProjectId } from '@/lib/project-input'
import { replaceCanvasInputSchema } from '@/lib/canvas-input'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { projectId: rawProjectId } = await params
  const projectId = parseProjectId(rawProjectId)
  if (!projectId.success) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, { status: body.status })
  const input = replaceCanvasInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_CANVAS' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(projectId.data, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    if (project.revision !== input.data.expectedRevision) {
      if (isDeepStrictEqual(project.canvas, input.data.canvas)) {
        return Response.json({ revision: project.revision, replayed: true })
      }
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }

    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas: input.data.canvas,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })
    return Response.json({ revision })
  } catch {
    return Response.json({ error: 'CANVAS_SAVE_FAILED' }, { status: 503 })
  }
}
