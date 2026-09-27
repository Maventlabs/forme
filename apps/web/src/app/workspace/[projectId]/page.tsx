import { and, eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { validateCanvasDocument } from '@forme/design-ir'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { getServerSession } from '@/lib/server-session'
import { parseProjectId } from '@/lib/project-input'
import { WorkspaceShell } from './workspace-shell'
import styles from './workspace.module.css'

export const metadata = { title: 'Workspace — FORME by Mavent' }

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const { projectId } = await params
  const parsedId = parseProjectId(projectId)
  if (!parsedId.success) notFound()

  let project: { id: string; name: string; canvas: unknown; revision: number } | undefined
  try {
    ;[project] = await getDb()
      .select({ id: projects.id, name: projects.name, canvas: projects.canvas, revision: projects.canvasRevision })
      .from(projects)
      .where(and(eq(projects.id, parsedId.data), eq(projects.userId, session.user.id)))
      .limit(1)
  } catch {
    return <main className={styles.unavailable}><p>Workspace unavailable. <a href="/projects">Retry from projects</a>.</p></main>
  }

  if (!project) notFound()
  const canvas = validateCanvasDocument(project.canvas)
  if (!canvas.success) return <main className={styles.unavailable}><p>Canvas data could not be loaded. <a href="/projects">Return to projects</a>.</p></main>
  return <WorkspaceShell projectId={project.id} projectName={project.name} name={session.user.name} email={session.user.email} canvas={canvas.data} revision={project.revision} />
}
