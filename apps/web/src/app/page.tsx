import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { MarketingNav } from './marketing-nav'
import { WorkspacePreview } from './workspace-preview'
import { LandingSections, SiteFooter } from './landing-sections'
import { EcosystemMarquee } from './ecosystem-marquee'
import { LandingMotion } from './landing-motion'
import styles from './landing.module.css'

export default function HomePage() {
  return (
    <LandingMotion>
      <MarketingNav />
      <main>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroText}>
            <h1 id="hero-heading" aria-label="Shape the interface before you build it."><span className={styles.lineMask} aria-hidden="true"><span data-hero-line>Shape the interface</span></span><span className={styles.lineMask} aria-hidden="true"><span data-hero-line>before you build it.</span></span></h1>
            <p data-hero-copy>A wireframe-first workspace for turning an idea into a clear, editable structure — with AI where you want it.</p>
            <div className={styles.heroActions} data-hero-actions>
              <Link href="/workspace" className={styles.primaryAction}>Try the workspace preview <ArrowUpRight size={17} aria-hidden="true" /></Link>
              <Link href="/workflow" className={styles.secondaryAction}>See the workflow <ArrowDownRight size={17} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className={styles.heroVisual} data-hero-stage>
            {/* PLACEHOLDER_ASSET — Ideal: genuine dark FORME workspace capture with the floating AI Composer editing a Hero node beside Desktop and Mobile frames; role: hero product proof; ratio: 16:10. Replace this illustrative reconstruction once the editor exists. */}
            <WorkspacePreview interactive />
            <p className={styles.heroCaption}><span>TRY THE PREVIEW · select a node or add text</span><span>Local preview · AI/editor in development</span></p>
          </div>
        </section>
        <EcosystemMarquee />
        <LandingSections />
      </main>
      <SiteFooter />
    </LandingMotion>
  )
}
