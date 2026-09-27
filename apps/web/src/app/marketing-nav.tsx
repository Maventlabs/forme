'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import styles from './landing.module.css'

export function MarketingNav() {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={styles.navSlot}>
      <nav className={`${styles.nav} ${compact ? styles.navCompact : ''}`} aria-label="Main navigation">
        <Link href="/" className={styles.navLogo} aria-label="FORME home">
          <Image src="/brand/forme/forme-logo-primary.png" alt="FORME by Mavent" width={598} height={176} priority />
        </Link>
        <div className={styles.navLinks}>
          <Link href="/workspace">Workspace preview</Link>
          <details className={styles.navDropdown}>
            <summary>Explore <ChevronDown size={13} aria-hidden="true" /></summary>
            <div className={styles.navMenu}>
              <Link href="/product">How FORME works</Link>
              <Link href="/design-md">DESIGN.md <span>Coming Soon</span></Link>
              <Link href="/crawl">Website import <span>Coming Soon</span></Link>
              <Link href="/mavent-products">Mavent products</Link>
            </div>
          </details>
          <Link href="/pricing">Pricing</Link>
        </div>
        <details className={styles.mobileNav}>
          <summary>Menu <ChevronDown size={13} aria-hidden="true" /></summary>
          <div className={styles.navMenu}>
            <Link href="/workspace">Workspace preview</Link><Link href="/product">Product</Link><Link href="/design-md">DESIGN.md · Coming Soon</Link><Link href="/crawl">Website import · Coming Soon</Link><Link href="/mavent-products">Mavent products</Link><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link>
          </div>
        </details>
        <div className={styles.navAccount}><Link href="/login" className={styles.loginLink}>Sign in</Link><Link href="/workspace" className={styles.navAction}>Try preview <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      </nav>
    </header>
  )
}
