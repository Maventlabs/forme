import { desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { projects } from '@/db/schema'
import { getServerSession } from '@/lib/server-session'
import { summarizeProjectCanvas } from '@/lib/project-preview'
import { ProjectsClient } from './projects-client'
import type { ProjectSummary } from './project-card'

export const metadata = { title: 'Workspace — FORME by Mavent' }

export default async function ProjectsPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  let initialProjects: ProjectSummary[] = []
  let initialError = false
  try {
    initialProjects = await getDb()
      .select({ id: projects.id, name: projects.name, createdAt: projects.createdAt, updatedAt: projects.updatedAt, canvas: projects.canvas })
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.updatedAt))
      .limit(50)
      .then((rows) => rows.map(({ canvas, ...project }) => ({ ...project, ...summarizeProjectCanvas(canvas) })))
  } catch {
    initialError = true
  }

  return <ProjectsClient initialProjects={initialProjects} initialError={initialError} name={session.user.name} email={session.user.email} />
}
