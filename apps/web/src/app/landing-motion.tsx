'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './landing.module.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline({ defaults: { ease: 'power2.out' } })
      intro.from('[data-hero-line]', { yPercent: 112, duration: .7, stagger: .14 })
        .from('[data-hero-copy]', { autoAlpha: 0, y: 16, duration: .42 }, '-=.34')
        .from('[data-hero-actions]', { autoAlpha: 0, y: 12, duration: .4 }, '-=.22')
        .from('[data-hero-stage]', { autoAlpha: 0, y: 30, scale: .975, duration: .65 }, '-=.13')

      root.current?.querySelectorAll<HTMLElement>('main section h2').forEach((heading) => {
        gsap.from(heading, { autoAlpha: 0, y: 25, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: heading, start: 'top 88%', once: true } })
      })
    })
    return () => media.revert()
  }, { scope: root })

  return <div className={styles.page} ref={root}>{children}</div>
}
