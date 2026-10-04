import { and, eq, sql } from 'drizzle-orm'
import { parseCanvasDocument, type CanvasDocument } from '@forme/design-ir'
import { getDb } from '@/db'
import { projects } from '@/db/schema'

export function getOwnedProjectCanvas(projectId: string, userId: string) {
  return getDb()
    .select({ id: projects.id, name: projects.name, canvas: projects.canvas, revision: projects.canvasRevision })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
    .then(([project]) => project ? { ...project, canvas: parseCanvasDocument(project.canvas) } : null)
}

export async function saveOwnedProjectCanvas(input: {
  projectId: string
  userId: string
  expectedRevision: number
  canvas: CanvasDocument
}) {
  const [saved] = await getDb()
    .update(projects)
    .set({
      canvas: input.canvas,
      canvasRevision: sql`${projects.canvasRevision} + 1`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(projects.id, input.projectId),
      eq(projects.userId, input.userId),
      eq(projects.canvasRevision, input.expectedRevision),
    ))
    .returning({ revision: projects.canvasRevision })

  return saved?.revision ?? null
}
