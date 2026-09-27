import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { getServerSession } from '@/lib/server-session'
import { createProjectInput } from '@/lib/project-input'
import { summarizeProjectCanvas } from '@/lib/project-preview'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const items = await getDb()
      .select({ id: projects.id, name: projects.name, createdAt: projects.createdAt, updatedAt: projects.updatedAt, canvas: projects.canvas })
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.updatedAt))
      .limit(50)

    return Response.json({
      projects: items.map(({ canvas, ...project }) => ({ ...project, ...summarizeProjectCanvas(canvas) })),
    })
  } catch {
    return Response.json({ error: 'PROJECTS_UNAVAILABLE' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const body = await readJsonBody(request)
  if (!body.ok) return Response.json({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, { status: body.status })

  const parsed = createProjectInput(body.value)
  if (!parsed.success) return Response.json({ error: 'INVALID_PROJECT' }, { status: 422 })

  try {
    const [project] = await getDb()
      .insert(projects)
      .values({ userId: session.user.id, name: parsed.data.name })
      .returning({ id: projects.id, name: projects.name, createdAt: projects.createdAt, updatedAt: projects.updatedAt })

    if (!project) return Response.json({ error: 'PROJECT_CREATE_FAILED' }, { status: 503 })
    return Response.json({ project }, { status: 201 })
  } catch {
    return Response.json({ error: 'PROJECT_CREATE_FAILED' }, { status: 503 })
  }
}
