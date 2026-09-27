import { isDeepStrictEqual } from 'node:util'
import { createCustomBlockFromNode } from '@forme/design-ir'
import { getServerSession } from '@/lib/server-session'
import { parseProjectId } from '@/lib/project-input'
import { createCustomBlockInputSchema } from '@/lib/canvas-input'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
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
  const input = createCustomBlockInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_CUSTOM_BLOCK' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(projectId.data, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    if (!project.canvas.nodes[input.data.nodeId]) return Response.json({ error: 'NODE_NOT_FOUND' }, { status: 404 })
    const result = createCustomBlockFromNode(project.canvas, input.data.nodeId, input.data.name, input.data.id)
    const existing = project.canvas.customBlocks[input.data.id]
    if (existing) {
      if (isDeepStrictEqual(existing, result.block)) {
        return Response.json({ block: existing, revision: project.revision, replayed: true })
      }
      return Response.json({ error: 'CUSTOM_BLOCK_ID_CONFLICT' }, { status: 409 })
    }
    if (project.revision !== input.data.expectedRevision) {
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }

    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas: result.document,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })
    return Response.json({ block: result.block, revision }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOM_BLOCK_ID_CONFLICT') {
      return Response.json({ error: 'CUSTOM_BLOCK_ID_CONFLICT' }, { status: 409 })
    }
    return Response.json({ error: 'CUSTOM_BLOCK_CREATE_FAILED' }, { status: 422 })
  }
}
