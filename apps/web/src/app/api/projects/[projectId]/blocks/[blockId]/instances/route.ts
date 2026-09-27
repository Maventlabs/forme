import { instantiateCustomBlock } from '@forme/design-ir'
import { getServerSession } from '@/lib/server-session'
import { parseProjectId } from '@/lib/project-input'
import { instantiateCustomBlockInputSchema } from '@/lib/canvas-input'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; blockId: string }> },
) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { projectId: rawProjectId, blockId } = await params
  const projectId = parseProjectId(rawProjectId)
  if (!projectId.success || !/^[0-9a-f-]{36}$/i.test(blockId)) {
    return Response.json({ error: 'CUSTOM_BLOCK_NOT_FOUND' }, { status: 404 })
  }
  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, { status: body.status })
  const input = instantiateCustomBlockInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_CUSTOM_BLOCK_INSTANCE' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(projectId.data, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    const instance = instantiateCustomBlock(project.canvas, blockId, {
      idMap: input.data.idMap,
      parentId: input.data.parentId ?? null,
    })
    if (instance.replayed) {
      return Response.json({ nodeId: instance.nodeId, idMap: instance.idMap, revision: project.revision, replayed: true })
    }
    if (project.revision !== input.data.expectedRevision) {
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }

    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas: instance.document,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })
    return Response.json({ nodeId: instance.nodeId, idMap: instance.idMap, revision }, { status: 201 })
  } catch {
    return Response.json({ error: 'CUSTOM_BLOCK_INSTANCE_FAILED' }, { status: 422 })
  }
}
