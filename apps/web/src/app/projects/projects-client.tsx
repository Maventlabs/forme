'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FolderPlus, Search, X } from 'lucide-react'
import { HubShell } from '../hub-shell'
import { ProjectCard, type ProjectSummary } from './project-card'
import styles from './projects.module.css'

export function ProjectsClient({
  initialProjects,
  initialError,
  name,
  email,
}: {
  initialProjects: ProjectSummary[]
  initialError: boolean
  name: string
  email: string
}) {
  const router = useRouter()
  const nameInput = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState(initialProjects)
  const [projectName, setProjectName] = useState('')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'recent' | 'all'>('recent')
  const [showCreate, setShowCreate] = useState(initialProjects.length === 0 && !initialError)
  const [error, setError] = useState(initialError ? 'Your projects could not be loaded. Retry to reconnect.' : '')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (showCreate) nameInput.current?.focus()
  }, [showCreate])

  async function retryProjects() {
    setError('')
    try {
      const response = await fetch('/api/projects', { signal: AbortSignal.timeout(10_000) })
      if (response.status === 401) {
        router.replace('/login')
        return
      }
      if (!response.ok) {
        setError('Your projects are still unavailable. Retry in a moment.')
        return
      }
      const result = await response.json() as { projects: ProjectSummary[] }
      setProjects(result.projects)
    } catch {
      setError('The project service is unavailable. Check your connection and retry.')
    }
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
        signal: AbortSignal.timeout(10_000),
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }
      if (!response.ok) {
        setError(response.status === 422 ? 'Give the project a name up to 80 characters.' : 'Project creation failed. Try again.')
        return
      }

      const result = await response.json() as { project: Omit<ProjectSummary, 'nodeCount' | 'preview'> }
      setProjects((current) => [{ ...result.project, nodeCount: 0, preview: [] }, ...current])
      setProjectName('')
      setShowCreate(false)
    } catch {
      setError('The project service is unavailable. Check your connection and retry.')
    } finally {
      setPending(false)
    }
  }

  const search = query.trim().toLocaleLowerCase()
  const matchingProjects = projects.filter((project) => project.name.toLocaleLowerCase().includes(search))
  const visibleProjects = view === 'recent' ? matchingProjects.slice(0, 8) : matchingProjects

  return (
    <HubShell active="/projects" name={name} email={email}>
      <main className={styles.page} aria-labelledby="workspace-title">
        <div className={styles.pageHeading}>
          <div>
            <p className={styles.kicker}>YOUR SPACE</p>
            <h1 id="workspace-title">Workspace</h1>
            <p className={styles.description}>Pick up a wireframe or start a new one.</p>
          </div>
          <button
            className={styles.newProject}
            type="button"
            aria-expanded={showCreate}
            aria-controls={showCreate ? 'new-project-form' : undefined}
            onClick={() => setShowCreate((current) => !current)}
          >
            {showCreate ? <X size={16} aria-hidden="true" /> : <FolderPlus size={16} aria-hidden="true" />}
            {showCreate ? 'Close' : 'New project'}
          </button>
        </div>

        {showCreate && (
          <form id="new-project-form" className={styles.createForm} onSubmit={createProject}>
            <label htmlFor="project-name">Name your project</label>
            <input
              ref={nameInput}
              id="project-name"
              autoComplete="off"
              maxLength={80}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. Studio homepage"
              required
              value={projectName}
            />
            <button className={styles.createSubmit} disabled={pending || !projectName.trim()} type="submit">
              {pending ? 'Creating…' : 'Create project'}
            </button>
          </form>
        )}

        {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" onClick={retryProjects}>Retry</button></div>}

        <div className={styles.projectToolbar}>
          <div className={styles.views} role="group" aria-label="Project view">
            <button type="button" aria-pressed={view === 'recent'} onClick={() => setView('recent')}>Recent</button>
            <button type="button" aria-pressed={view === 'all'} onClick={() => setView('all')}>All projects</button>
          </div>
          <label className={styles.search}>
            <Search size={15} aria-hidden="true" />
            <input aria-label="Search projects" onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" type="search" value={query} />
          </label>
        </div>

        <div className={styles.listHeading}>
          <h2>{view === 'recent' ? 'Recent projects' : 'All projects'}</h2>
          <span>{visibleProjects.length} shown · {projects.length} total</span>
        </div>

        {visibleProjects.length > 0 ? (
          <ul className={styles.projectGrid}>
            {visibleProjects.map((project) => <li key={project.id}><ProjectCard project={project} /></li>)}
          </ul>
        ) : (
          <section className={styles.empty} aria-live="polite">
            {search ? <Search size={21} aria-hidden="true" /> : <FolderPlus size={21} aria-hidden="true" />}
            <h2>{search ? 'No matching projects' : 'No projects yet'}</h2>
            <p>{search ? 'Try another project name.' : 'Create a project to start shaping your first wireframe.'}</p>
            {!search && !showCreate && <button type="button" onClick={() => setShowCreate(true)}>Create your first project</button>}
          </section>
        )}
      </main>
    </HubShell>
  )
}
