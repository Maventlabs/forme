import { and, eq } from 'drizzle-orm'
import { parseCanvasDocument } from '@forme/design-ir'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { getServerSession } from '@/lib/server-session'
import { parseProjectId } from '@/lib/project-input'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { projectId } = await params
  const parsedId = parseProjectId(projectId)
  if (!parsedId.success) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })

  try {
    const [project] = await getDb()
      .select({
        id: projects.id,
        name: projects.name,
        canvas: projects.canvas,
        revision: projects.canvasRevision,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(and(eq(projects.id, parsedId.data), eq(projects.userId, session.user.id)))
      .limit(1)

    if (!project) return Response.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
    return Response.json({ project: { ...project, canvas: parseCanvasDocument(project.canvas) } })
  } catch {
    return Response.json({ error: 'PROJECT_UNAVAILABLE' }, { status: 503 })
  }
}
