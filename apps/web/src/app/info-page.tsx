import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { MarketingNav } from './marketing-nav'
import { SiteFooter } from './landing-sections'
import styles from './info.module.css'

export function InfoPage({ label, title, description, details }: { label: string; title: string; description: string; details: readonly string[] }) {
  return (
    <>
      <MarketingNav />
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.label}>{label}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className={styles.details}>{details.map((detail) => <p key={detail}>{detail}</p>)}</div>
        <div className={styles.actions}><Link href="/" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back to FORME</Link><Link href="/product">Explore the product <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      </main>
      <SiteFooter />
    </>
  )
}
