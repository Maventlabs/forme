import { isDeepStrictEqual } from 'node:util'
import { removeNode, updateNode } from '@forme/design-ir'
import { getServerSession } from '@/lib/server-session'
import { deleteNodeInputSchema, updateNodeInputSchema } from '@/lib/canvas-input'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ nodeId: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { nodeId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(nodeId)) return Response.json({ error: 'NODE_NOT_FOUND' }, { status: 404 })
  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, { status: body.status })
  const input = updateNodeInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_NODE_UPDATE' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(input.data.projectId, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    if (!project.canvas.nodes[nodeId]) return Response.json({ error: 'NODE_NOT_FOUND' }, { status: 404 })

    const canvas = updateNode(project.canvas, nodeId, input.data.changes)
    if (project.revision !== input.data.expectedRevision) {
      if (isDeepStrictEqual(canvas.nodes[nodeId], project.canvas.nodes[nodeId])) {
        return Response.json({ node: project.canvas.nodes[nodeId], revision: project.revision, replayed: true })
      }
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }
    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })

    return Response.json({ node: canvas.nodes[nodeId], revision })
  } catch {
    return Response.json({ error: 'NODE_UPDATE_FAILED' }, { status: 422 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { nodeId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(nodeId)) return Response.json({ error: 'NODE_NOT_FOUND' }, { status: 404 })
  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, { status: body.status })
  const input = deleteNodeInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_NODE_DELETE' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(input.data.projectId, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    if (!project.canvas.nodes[nodeId]) {
      return Response.json({ deletedNodeId: nodeId, revision: project.revision, replayed: true })
    }
    if (project.revision !== input.data.expectedRevision) {
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }

    const canvas = removeNode(project.canvas, nodeId)
    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })

    return Response.json({ deletedNodeId: nodeId, revision })
  } catch {
    return Response.json({ error: 'NODE_DELETE_FAILED' }, { status: 422 })
  }
}
