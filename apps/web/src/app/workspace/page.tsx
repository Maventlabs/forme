import { MarketingNav } from '../marketing-nav'
import { SiteFooter } from '../landing-sections'
import { WorkspacePreview } from '../workspace-preview'
import styles from './workspace-page.module.css'

export const metadata = { title: 'Workspace preview — FORME by Mavent' }

export default function WorkspacePage() {
  return <><MarketingNav /><main className={styles.main}><h1>Explore the workspace preview.</h1><p>Select Heading or Media, switch breakpoint, or add a text block. This is a local temporary demonstration; projects, AI editing and cloud saving will open with the real editor.</p><div className={styles.stage}><WorkspacePreview interactive /></div><p className={styles.note}>Preview changes reset when the page reloads. The production workspace is still in development.</p></main><SiteFooter /></>
}
