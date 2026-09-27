'use client'

import Image from 'next/image'
import { useState } from 'react'
import { SiAnthropic, SiFigma, SiGithub, SiGoogle, SiVercel } from '@icons-pack/react-simple-icons'
import styles from './marquee.module.css'

const marks = [
  { name: 'FORME', icon: <Image src="/brand/forme/forme-logo-symbol.png" alt="" width={189} height={174} style={{ width: 36, height: 'auto' }} /> },
  { name: 'GitHub', icon: <SiGithub size={27} aria-hidden="true" /> },
  { name: 'Vercel', icon: <SiVercel size={27} aria-hidden="true" /> },
  { name: 'Anthropic', icon: <SiAnthropic size={27} aria-hidden="true" /> },
  { name: 'Google', icon: <SiGoogle size={27} aria-hidden="true" /> },
  { name: 'Figma', icon: <SiFigma size={27} aria-hidden="true" /> },
]

export function EcosystemMarquee() {
  const [paused, setPaused] = useState(false)
  return (
    <section className={styles.section} aria-label="Tools in the creative ecosystem">
      <div className={styles.labelRow}><p className={styles.label}>A visual vocabulary for the tools around your workflow <span>· Example brands, not customers or partners</span></p><button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Resume movement' : 'Pause movement'}</button></div>
      <div className={`${styles.window} ${paused ? styles.paused : ''}`}>
        <div className={styles.track}>
          {[0, 1].map((copy) => <div className={styles.set} key={copy} aria-hidden={copy === 1}>{marks.map((mark) => <span className={styles.mark} key={`${copy}-${mark.name}`}>{mark.icon}<span>{mark.name}</span></span>)}</div>)}
        </div>
      </div>
    </section>
  )
}
