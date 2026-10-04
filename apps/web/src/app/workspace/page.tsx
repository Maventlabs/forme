import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { WorkspacePreview } from '../workspace-preview'
import styles from './workspace-page.module.css'

export const metadata = { title: 'Workspace — FORME by Mavent' }
export const dynamic = 'force-dynamic'

// The workspace is an authenticated surface. Anonymous visitors are sent to
// sign in first, exactly like every other private project route.
export default async function WorkspacePage() {
  const session = await getServerSession()
  if (!session) redirect('/login?next=/workspace')

  return (
    <main className={styles.main}>
      <h1>Workspace preview</h1>
      <p>Select Heading or Media, switch breakpoint, or add a text block. Changes on this page are temporary and reset when it reloads.</p>
      <div className={styles.stage}><WorkspacePreview interactive /></div>
      <p className={styles.note}>Your own saved projects live in the project hub.</p>
    </main>
  )
}