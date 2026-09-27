import { isDeepStrictEqual } from 'node:util'
import {
  createNodeFromBlock,
  insertNode,
} from '@forme/design-ir'
import { getServerSession } from '@/lib/server-session'
import { createNodeInputSchema } from '@/lib/canvas-input'
import { getOwnedProjectCanvas, saveOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, { status: body.status })
  const input = createNodeInputSchema.safeParse(body.value)
  if (!input.success) return Response.json({ error: 'INVALID_NODE' }, { status: 422 })

  try {
    const project = await getOwnedProjectCanvas(input.data.projectId, session.user.id)
    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    if (input.data.customBlockId) {
      const customRoot = project.canvas.customBlocks[input.data.customBlockId]?.nodes[project.canvas.customBlocks[input.data.customBlockId]?.rootId ?? '']
      if (!customRoot || customRoot.type !== input.data.blockId) {
        return Response.json({ error: 'CUSTOM_BLOCK_NOT_FOUND' }, { status: 404 })
      }
    }
    const node = createNodeFromBlock(input.data.blockId, {
      id: input.data.id,
      parentId: input.data.parentId ?? null,
      customBlockId: input.data.customBlockId,
      label: input.data.label,
      props: input.data.props,
      layouts: input.data.layouts,
    })
    const existing = project.canvas.nodes[node.id]
    if (existing) {
      if (isDeepStrictEqual(existing, node)) {
        return Response.json({ node: existing, revision: project.revision, replayed: true })
      }
      return Response.json({ error: 'NODE_ID_CONFLICT' }, { status: 409 })
    }
    if (project.revision !== input.data.expectedRevision) {
      return Response.json({ error: 'REVISION_CONFLICT', revision: project.revision }, { status: 409 })
    }

    const canvas = insertNode(project.canvas, node)
    const revision = await saveOwnedProjectCanvas({
      projectId: project.id,
      userId: session.user.id,
      expectedRevision: input.data.expectedRevision,
      canvas,
    })
    if (revision === null) return Response.json({ error: 'REVISION_CONFLICT' }, { status: 409 })

    return Response.json({ node, revision }, { status: 201 })
  } catch {
    return Response.json({ error: 'NODE_CREATE_FAILED' }, { status: 422 })
  }
}
