'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import styles from './workspace.module.css'

export function LogoutButton() {
  const router = useRouter()
  const [error, setError] = useState('')

  async function signOut() {
    setError('')
    const result = await authClient.signOut()
    if (result.error) {
      setError('Sign-out failed. Retry.')
      return
    }
    router.replace('/login')
    router.refresh()
  }

  return <div className={styles.signout}><button onClick={signOut} type="button">Sign out</button>{error && <span role="alert">{error}</span>}</div>
}
