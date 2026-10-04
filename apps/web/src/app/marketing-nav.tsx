'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './landing.module.css'

// Page-level navigation only. There is no section-anchor menu and no crowded
// mega-menu: every item below is a real route.
const navigation = [
  { href: '/product', label: 'Product' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/design-md', label: 'DESIGN.md', comingSoon: true },
  { href: '/crawl', label: 'Website import', comingSoon: true },
  { href: '/mavent-products', label: 'Mavent' },
]

export function MarketingNav() {
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className={styles.navSlot}>
      <nav className={`${styles.nav} ${compact ? styles.navCompact : ''}`} aria-label="Main navigation">
        <Link href="/" className={styles.navLogo} aria-label="FORME home">
          <Image src="/brand/forme/forme-logo-primary.png" alt="FORME by Mavent" width={598} height={176} priority />
        </Link>

        <ul className={styles.navLinks}>
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                {item.label}
                {item.comingSoon ? <span className={styles.navSoon}>Soon</span> : null}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className={styles.navToggle}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="forme-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <div className={styles.navAccount}>
          <Link href="/login" className={styles.navSecondary}>Sign in</Link>
          <Link href="/login?next=/projects" className={styles.navAction}>Open workspace</Link>
        </div>

        {menuOpen ? (
          <div className={styles.navMenu} id="forme-mobile-menu">
            <ul>
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)}>
                    <span>{item.label}</span>
                    {item.comingSoon ? <span className={styles.navSoon}>Coming soon</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.navMenuActions}>
              <Link href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/login?next=/projects" onClick={() => setMenuOpen(false)}>Open workspace</Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  )
}