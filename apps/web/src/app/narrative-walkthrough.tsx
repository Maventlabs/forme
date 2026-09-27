'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, AtSign, Box, FileText, Image as ImageIcon, Plus, Type } from 'lucide-react'
import Link from 'next/link'
import styles from './narrative.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const stages = ['Build', 'Direct', 'Refine'] as const

export function NarrativeWalkthrough() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      root.current?.querySelectorAll<HTMLElement>('[data-narrative-step]').forEach((step, index) => {
        ScrollTrigger.create({ trigger: step, start: 'top 45%', end: 'bottom 45%', onEnter: () => setActive(index), onEnterBack: () => setActive(index) })
      })
    })
    return () => mm.revert()
  }, { scope: root })

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('[data-stage-content]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .45, ease: 'power2.out' })
  }, { scope: root, dependencies: [active], revertOnUpdate: true })

  return (
    <section className={styles.section} ref={root} aria-labelledby="narrative-heading">
      <div className={styles.heading}><span>ONE WORKSPACE · THREE WAYS TO SHAPE IT</span><h2 id="narrative-heading">Every change has a place.</h2></div>
      <div className={styles.layout}>
        <div className={styles.story}>
          <div className={styles.step} data-narrative-step><span className={styles.stepNumber}>01 / BLOCKS</span><h3>Think in pieces that mean something.</h3><p>Place a Hero, then refine its heading, media, and action. Every piece has a name and a place in the page.</p><Link href="/workspace">Explore the block preview <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <div className={styles.step} data-narrative-step><span className={styles.stepNumber}>02 / AI COMPOSER</span><h3>Ask for a change. Keep the context.</h3><p>The Composer stays inside the canvas. A request scoped to @Hero leaves the next section where it is.</p><Link href="/workflow">See the workflow <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <div className={styles.step} data-narrative-step><span className={styles.stepNumber}>03 / DESIGN DIRECTION</span><h3>One structure. Your visual rules.</h3><p>Apply a preset or bring your DESIGN.md; density, type and rhythm change while semantic content stays put.</p><Link href="/design-md">DESIGN.md status <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        </div>
        <div className={styles.sticky}>
          <div className={styles.stage} aria-label="Illustrative FORME product walkthrough">
            <div className={styles.stageBar}><span>FORME / Homepage</span><span>Illustrative preview</span></div>
            <div className={styles.stageTabs} role="group" aria-label="Walkthrough step">
              {stages.map((stage, index) => <button type="button" key={stage} onClick={() => setActive(index)} aria-pressed={active === index}>{stage}</button>)}
            </div>
            <div key={active} className={styles.stageContent} data-stage-content>
              {active === 0 && <div className={styles.blockView}><div className={styles.palette}><span><Type size={18} /> Text</span><span><ImageIcon size={18} /> Media</span><span><Box size={18} /> Blocks</span></div><div className={styles.pageFrame}><span>Hero · Section template</span><div className={styles.nodeGrid}><div className={styles.nodeCopy}><small>Heading</small><strong>Give your idea<br />a clear shape.</strong><i>Paragraph</i><p>Make it editable from the start.</p><em>Button</em></div><div className={styles.mediaNode}><ImageIcon size={30} strokeWidth={1.2} /><small>Media · Image</small></div></div></div></div>}
              {active === 1 && <div className={styles.composerView}><div className={styles.selectedFrame}><span>@Hero · selected</span><div className={styles.frameLines}><i /><i /><i /></div><div className={styles.frameMedia}><ImageIcon size={27} strokeWidth={1.2} /></div></div><div className={styles.nextFrame}>Next section · unchanged</div><div className={styles.floatingComposer}><p className={styles.typed}>Make @Hero more focused, keep the next section.</p><div><span><Plus size={15} /> / <AtSign size={15} /></span><span>Preset</span><span>Model</span><span>Send</span></div></div></div>}
              {active === 2 && <div className={styles.rulesView}><div className={styles.ruleFrame}><span>Same semantic structure</span><div /><div /><div className={styles.ruleMedia} /></div><div className={styles.rulePanel}><FileText size={22} /><strong>DESIGN.md</strong><small>Type scale · spacing · density</small><span>Upload / Paste / Edit</span></div></div>}
            </div>
            <p className={styles.stageNote}>{active === 0 ? 'Blocks stay editable.' : active === 1 ? 'No provider call is made in this preview.' : 'Automatic DESIGN.md generation · Coming Soon'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
