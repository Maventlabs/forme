'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, LayoutDashboard, LogOut, Menu, Moon, ScanLine, Sun } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'
import styles from './hub-shell.module.css'

const destinations = [
  { href: '/projects', label: 'Workspace', icon: LayoutDashboard },
  { href: '/generator', label: 'Generator', icon: FileText },
  { href: '/cloning', label: 'Cloning', icon: ScanLine },
] as const

type HubDestination = (typeof destinations)[number]['href']
type HubTheme = 'dark' | 'light'

const themeEvent = 'forme:hub-theme-change'
const mobileQuery = '(max-width: 760px)'
let transientTheme: HubTheme | null = null

function subscribeTheme(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === 'forme-hub-theme' || event.key === null) transientTheme = null
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(themeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(themeEvent, onChange)
  }
}

function getThemeSnapshot(): HubTheme {
  try {
    const stored = window.localStorage.getItem('forme-hub-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // Fall through to the in-memory or system preference.
  }
  return transientTheme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
}

function getServerThemeSnapshot(): HubTheme {
  return 'dark'
}

function saveTheme(theme: HubTheme) {
  transientTheme = theme
  try {
    window.localStorage.setItem('forme-hub-theme', theme)
  } catch {
    // The in-memory preference still applies when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(themeEvent))
}

function subscribeMobile(onChange: () => void) {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getMobileSnapshot() {
  return window.matchMedia(mobileQuery).matches
}

function getServerMobileSnapshot() {
  return false
}

export function HubShell({
  active,
  name,
  email,
  children,
}: {
  active: HubDestination
  name: string
  email: string
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const wasMobileMenuOpen = useRef(false)
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getServerMobileSnapshot)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const accountLabel = name || email

  useEffect(() => {
    if (!isMobile) {
      wasMobileMenuOpen.current = false
      return
    }
    if (mobileOpen) {
      wasMobileMenuOpen.current = true
      sidebarRef.current?.querySelector<HTMLAnchorElement>('nav a')?.focus()
    } else if (wasMobileMenuOpen.current) {
      wasMobileMenuOpen.current = false
      menuButtonRef.current?.focus()
    }
  }, [isMobile, mobileOpen])

  useEffect(() => {
    if (!isMobile || !mobileOpen) return

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
      if (!focusable?.length) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', keepFocusInside)
    return () => window.removeEventListener('keydown', keepFocusInside)
  }, [isMobile, mobileOpen])

  function toggleMenu() {
    if (isMobile) {
        setMobileOpen((open) => !open)
      return
    }
    setCollapsed((value) => !value)
  }

  function toggleTheme() {
    saveTheme(theme === 'dark' ? 'light' : 'dark')
  }

  async function signOut() {
    setSignOutError('')
    setSigningOut(true)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setSignOutError('Sign-out failed. Retry.')
        setSigningOut(false)
        return
      }
      router.replace('/login')
      router.refresh()
    } catch {
      setSignOutError('Sign-out failed. Retry.')
      setSigningOut(false)
    }
  }

  return (
    <div className={styles.shell} data-theme={theme}>
      {isMobile && mobileOpen && <button className={styles.scrim} type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside
        ref={sidebarRef}
        id="forme-hub-navigation"
        aria-hidden={isMobile && !mobileOpen}
        aria-modal={isMobile && mobileOpen ? true : undefined}
        aria-label="FORME navigation"
        role={isMobile && mobileOpen ? 'dialog' : undefined}
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${isMobile ? mobileOpen ? styles.mobileOpen : styles.mobileClosed : ''}`}
      >
        <Link className={styles.brand} href="/" aria-label="FORME home" onClick={() => setMobileOpen(false)}>
          <Image className={styles.darkMark} src="/brand/forme/forme-logo-mark-white.png" alt="" width={24} height={22} priority />
          <Image className={styles.lightMark} src="/brand/forme/forme-logo-symbol.png" alt="" width={24} height={22} priority />
          <span className={styles.brandText}>FORME</span>
        </Link>

        <p className={styles.navHeading}>BUILD</p>
        <nav className={styles.navigation} aria-label="Product areas">
          {destinations.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              className={`${styles.navLink} ${active === href ? styles.navLinkActive : ''}`}
              href={href}
              aria-label={label}
              aria-current={active === href ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.account}>
            <span className={styles.avatar} aria-hidden="true">{accountLabel.slice(0, 1).toUpperCase()}</span>
            <span className={styles.accountText}><strong>{accountLabel}</strong><small>Personal workspace</small></span>
          </div>
          <button className={styles.signOut} type="button" aria-label={signingOut ? 'Signing out' : 'Sign out'} disabled={signingOut} onClick={signOut} title={collapsed ? 'Sign out' : undefined}>
            <LogOut size={15} aria-hidden="true" />
            <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
          {signOutError && <p className={styles.signOutError} role="alert">{signOutError}</p>}
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <button
            ref={menuButtonRef}
            className={styles.menuButton}
            type="button"
            aria-label={isMobile ? mobileOpen ? 'Close navigation menu' : 'Open navigation menu' : collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-controls="forme-hub-navigation"
            aria-expanded={isMobile ? mobileOpen : !collapsed}
            onClick={toggleMenu}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <div className={styles.location} aria-label="Current page">
            <span>FORME</span><i aria-hidden="true">/</i><strong>{destinations.find((item) => item.href === active)?.label}</strong>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.themeButton} type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
            <span className={styles.topbarAccount} title={email}>{accountLabel}</span>
          </div>
        </header>
        <div className={styles.contentSurface}>
          {active === '/projects' && <div className={styles.waveField} aria-hidden="true" />}
          <div key={pathname} className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}
