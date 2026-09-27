import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MarketingNav } from '../marketing-nav'
import { SiteFooter } from '../landing-sections'
import { PlaceholderAsset } from '../placeholder-asset'
import styles from './products.module.css'

export const metadata = { title: 'Mavent products — FORME' }

const products = ['FORME', 'Vulpix Mavent', 'Ignix', 'AnyMD', 'Moxa'] as const

export default function MaventProductsPage() {
  return <><MarketingNav /><main className={styles.main}><span className={styles.kicker}>THE MAVENT COLLECTION</span><h1>Mavent product collection.</h1><p>Descriptions, screenshots, and official destination links are placeholders until their source details are provided.</p><div className={styles.grid}>{products.map((name, index) => <article className={styles.product} key={name}><PlaceholderAsset name={name} idealAsset={`Owner-approved ${name} website screenshot`} role="product preview in the Mavent collection" /><div className={styles.bottom}><h2>{name}</h2>{index === 0 ? <Link href="/product">FORME product page <ArrowRight size={15} aria-hidden="true" /></Link> : <button type="button" disabled title="Official description and website URL pending from Mavent">Website link pending</button>}</div></article>)}</div><Link href="/" className={styles.back}><ArrowLeft size={16} aria-hidden="true" /> Back to FORME</Link></main><SiteFooter /></>
}
