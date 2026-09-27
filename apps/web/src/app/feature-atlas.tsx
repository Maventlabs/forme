'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './atlas.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function FeatureAtlas() {
  const root = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<'Flow' | 'Stack'>('Flow')

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.from('[data-atlas-card]', { opacity: 0, y: 25, stagger: .09, duration: .55, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } })
  }, { scope: root })

  return <section className={styles.section} ref={root} aria-labelledby="atlas-heading"><div className={styles.intro}><span>THE PARTS THAT HOLD TOGETHER</span><h2 id="atlas-heading">Designed as a system,<br />not a pile of screens.</h2><p>A page has structure, a responsive behavior, and a visual direction. FORME keeps each layer identifiable.</p></div><div className={styles.grid}>
    <article className={`${styles.card} ${styles.structure}`} data-atlas-card><div className={styles.cardHead}><span>01 / STRUCTURE</span><div className={styles.switch} role="group" aria-label="Preview layout mode"><button type="button" onClick={() => setMode('Flow')} aria-pressed={mode === 'Flow'}>Flow</button><button type="button" onClick={() => setMode('Stack')} aria-pressed={mode === 'Stack'}>Stack</button></div></div><div className={styles.diagram}><svg viewBox="0 0 530 235" role="img" aria-label={`${mode} layout diagram connecting a Hero to its semantic children`}><rect x="190" y="12" width="150" height="42" rx="6" className={styles.diagramParent} /><text x="265" y="39" textAnchor="middle">HERO</text><path d={mode === 'Flow' ? 'M265 54 V106 M90 106 H440 M90 106 V139 M265 106 V139 M440 106 V139' : 'M265 54 V78 M265 111 V128 M265 161 V178'} className={styles.diagramLine} /><rect x={mode === 'Flow' ? '25' : '190'} y={mode === 'Flow' ? '139' : '78'} width="130" height="33" rx="4" /><text x={mode === 'Flow' ? '90' : '255'} y={mode === 'Flow' ? '160' : '99'} textAnchor="middle">HEADING</text><rect x="200" y="139" width="130" height="33" rx="4" /><text x="265" y="160" textAnchor="middle">MEDIA</text><rect x={mode === 'Flow' ? '375' : '190'} y={mode === 'Flow' ? '139' : '178'} width="130" height="33" rx="4" /><text x={mode === 'Flow' ? '440' : '255'} y={mode === 'Flow' ? '160' : '199'} textAnchor="middle">ACTION</text></svg></div><div className={styles.cardFoot}><h3>One node. A meaningful role.</h3><p>Try the layout switch. Hierarchy stays intact when the arrangement changes.</p></div></article>
    <article className={`${styles.card} ${styles.scope}`} data-atlas-card><span className={styles.index}>02 / FOCUS</span><div className={styles.scopeGraphic}><div><span>@Hero</span><i /><i /></div><div className={styles.dimmed}><span>Unrelated section</span><i /></div></div><h3>Change what you mean.</h3><p>Scope is a boundary, not a prompt decoration.</p></article>
    <article className={`${styles.card} ${styles.context}`} data-atlas-card><span className={styles.index}>03 / DIRECTION</span><div className={styles.fileGraphic}><div>DESIGN.md</div><code>type: Instrument Sans<br />grid: 12 columns<br />rhythm: spacious<br />radius: restrained</code></div><h3>Keep the design rules close.</h3><p>Preset and manual context remain distinct inputs.</p></article>
    <article className={`${styles.card} ${styles.breakpoints}`} data-atlas-card><span className={styles.index}>04 / RESPONSIVE</span><div className={styles.frames}><div><small>DESKTOP · 1440</small><span /><span /><i /></div><div><small>MOBILE · 390</small><span /><span /><i /></div></div><div><h3>Same identity, different layout.</h3><p>Refine a breakpoint without duplicating what the block means.</p></div></article>
  </div></section>
}
