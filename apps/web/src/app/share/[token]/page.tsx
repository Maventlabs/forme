import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { resolveSharedProject } from '@/lib/share-service'
import { renderCanvasSvg } from '@/lib/export-artifact'
import styles from './share.module.css'

export const dynamic = 'force-dynamic'

// Public, read-only projection of a shared project.
// Unknown, revoked and expired tokens are indistinguishable: all render 404.
export default async function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const shared = await resolveSharedProject(token).catch(() => null)
  if (!shared) notFound()

  const svg = renderCanvasSvg(shared.project.canvas, { projectName: shared.project.name, breakpoint: 'desktop' })

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Image src="/brand/forme/forme-logo-primary.png" alt="FORME" width={120} height={35} priority />
        <span className={styles.readOnly}>Read-only share</span>
      </header>
      <section className={styles.project}>
        <h1>{shared.project.name}</h1>
        <div className={styles.canvas} dangerouslySetInnerHTML={{ __html: svg }} />
      </section>
      <footer className={styles.footer}>
        <p>This is a static snapshot shared from FORME. Editing is not available here.</p>
        <Link href="/">Create your own wireframe</Link>
      </footer>
    </main>
  )
}