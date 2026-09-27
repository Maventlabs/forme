'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import styles from './login.module.css'

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      const result = mode === 'sign-up'
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password })

      if (result.error) {
        setError(result.error.status === 429
          ? 'Too many attempts. Wait a minute, then try again.'
          : mode === 'sign-up'
            ? 'Account creation failed. Check your details or sign in instead.'
            : 'Sign-in failed. Check your email and password, then try again.')
        return
      }

      router.replace('/projects')
      router.refresh()
    } catch {
      setError('We could not reach the account service. Check your connection and retry.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className={styles.card} aria-labelledby="account-title">
      <p className={styles.eyebrow}>FORME workspace</p>
      <h1 id="account-title">{mode === 'sign-in' ? 'Welcome back.' : 'Make room to build.'}</h1>
      <p className={styles.description}>Your projects are private to your account.</p>

      <div className={styles.modeSwitch} aria-label="Account action">
        <button type="button" aria-pressed={mode === 'sign-in'} onClick={() => { setMode('sign-in'); setError('') }}>Sign in</button>
        <button type="button" aria-pressed={mode === 'sign-up'} onClick={() => { setMode('sign-up'); setError('') }}>Create account</button>
      </div>

      <form className={styles.form} onSubmit={submit}>
        {mode === 'sign-up' && (
          <label className={styles.field}>
            <span>Name</span>
            <input autoComplete="name" maxLength={120} name="name" onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
        )}
        <label className={styles.field}>
          <span>Email</span>
          <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} maxLength={128} minLength={12} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          {mode === 'sign-up' && <small>Use at least 12 characters.</small>}
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.submit} disabled={pending} type="submit">
          {pending ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
        </button>
      </form>
      <p className={styles.note}>Email and password are available now. Google and GitHub sign-in will appear after their credentials are configured.</p>
    </section>
  )
}
