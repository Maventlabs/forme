import Link from 'next/link'
import { ArrowLeft, Clock3 } from 'lucide-react'
import styles from './hub-feature.module.css'

export function HubFeature({
  eyebrow,
  title,
  description,
  status,
}: {
  eyebrow: string
  title: string
  description: string
  status: string
}) {
  return (
    <main className={styles.page} aria-labelledby="feature-title">
      <div className={styles.heading}>
        <p>{eyebrow}</p>
        <h1 id="feature-title">{title}</h1>
        <span>{description}</span>
      </div>
      <section className={styles.status} aria-labelledby="feature-status">
        <div className={styles.statusIcon}><Clock3 size={18} aria-hidden="true" /></div>
        <div>
          <p className={styles.statusLabel}>Coming soon</p>
          <h2 id="feature-status">{status}</h2>
          <p className={styles.note}>This area is not active yet. No files or URLs are processed here.</p>
        </div>
      </section>
      <Link className={styles.back} href="/projects"><ArrowLeft size={15} aria-hidden="true" />Back to Workspace</Link>
    </main>
  )
}
