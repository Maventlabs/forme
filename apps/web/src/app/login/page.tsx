import { Suspense } from 'react'
import { SiteFooter } from '../landing-sections'
import { MarketingNav } from '../marketing-nav'
import { LoginForm } from './login-form'
import styles from './login.module.css'

export const metadata = { title: 'Sign in — FORME by Mavent' }

export default function LoginPage() {
  return (
    <>
      <MarketingNav />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.auth} />}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  )
}