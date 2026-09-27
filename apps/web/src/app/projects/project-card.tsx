import Link from 'next/link'
import { ArrowUpRight, EyeOff, Plus } from 'lucide-react'
import type { ProjectCanvasSummary, ProjectPreviewKind } from '@/lib/project-preview'
import styles from './projects.module.css'

export type ProjectSummary = {
  id: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
} & ProjectCanvasSummary

const previewClasses: Record<ProjectPreviewKind, string> = {
  heading: styles.previewHeading,
  copy: styles.previewCopy,
  media: styles.previewMedia,
  control: styles.previewControl,
  structure: styles.previewStructure,
  block: styles.previewBlock,
}

function formatEditedDate(value: Date | string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Edited recently'
  return `Edited ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date)}`
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const blockLabel = project.nodeCount === 1 ? '1 block' : `${project.nodeCount} blocks`
  const previewLabel = project.nodeCount > 0 && project.preview.length === 0 ? 'all blocks hidden on desktop' : ''

  return (
    <Link className={styles.projectCard} href={`/workspace/${project.id}`} aria-label={`Open ${project.name}, ${blockLabel}${previewLabel ? `, ${previewLabel}` : ''}`}>
      <div className={styles.previewStage} aria-hidden="true">
        <div className={styles.previewWindow}><span /><span /><span /></div>
        <div className={styles.previewPaper}>
          {project.preview.length > 0 ? project.preview.map((node, index) => (
            <span
              key={`${node.kind}-${index}`}
              className={`${styles.previewNode} ${previewClasses[node.kind]}`}
              style={{ marginInlineStart: node.depth * 9 }}
            />
          )) : project.nodeCount === 0 ? (
            <span className={styles.blankPreview}><Plus size={15} aria-hidden="true" /></span>
          ) : (
            <span className={`${styles.blankPreview} ${styles.hiddenPreview}`}><EyeOff size={14} aria-hidden="true" />Hidden on Desktop</span>
          )}
        </div>
      </div>
      <div className={styles.projectDetails}>
        <div className={styles.projectCopy}>
          <h3>{project.name}</h3>
          <p>{blockLabel}{previewLabel && <><span aria-hidden="true">·</span>{previewLabel}</>}<span aria-hidden="true">·</span>{formatEditedDate(project.updatedAt)}</p>
        </div>
        <ArrowUpRight className={styles.projectArrow} size={17} aria-hidden="true" />
      </div>
    </Link>
  )
}
