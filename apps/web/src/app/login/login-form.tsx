'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import styles from './login.module.css'

const PASSWORD_HINT = 'At least 12 characters.'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requested = searchParams.get('next')
  // Only same-origin, absolute paths are honoured, so `next` can never be used
  // to bounce a signed-in user to an external site.
  const destination = requested && /^\/(?!\/)[\w\-/?=&%.]*$/.test(requested) ? requested : '/projects'

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)

  function changeMode(next: 'sign-in' | 'sign-up') {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setPending(true)

    try {
      const result = mode === 'sign-up'
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password })

      if (result.error) {
        setError(result.error.status === 429
          ? 'Too many attempts. Wait a minute, then try again.'
          : mode === 'sign-up'
            ? 'Account creation failed. Check your details, or sign in instead.'
            : 'Sign-in failed. Check your email and password, then try again.')
        return
      }

      router.replace(destination)
      router.refresh()
    } catch {
      setError('We could not reach the account service. Check your connection and retry.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={styles.auth}>
      <section className={styles.panel} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</p>
        <h1 id="auth-title" className={styles.title}>
          {mode === 'sign-in' ? 'Welcome back.' : 'Start shaping interfaces.'}
        </h1>
        <p className={styles.description}>
          {mode === 'sign-in'
            ? 'Sign in to open your projects and continue where you stopped.'
            : 'Create an account to keep private wireframe projects, semantic canvases, and provider connections.'}
        </p>

        <div className={styles.modeSwitch} role="group" aria-label="Choose sign in or create account">
          <button type="button" aria-pressed={mode === 'sign-in'} onClick={() => changeMode('sign-in')}>Sign in</button>
          <button type="button" aria-pressed={mode === 'sign-up'} onClick={() => changeMode('sign-up')}>Create account</button>
        </div>

        <form className={styles.form} onSubmit={submit} noValidate>
          {mode === 'sign-up' ? (
            <div className={styles.field}>
              <label htmlFor="forme-auth-name">Name</label>
              <input
                id="forme-auth-name"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="forme-auth-email">Email</label>
            <input
              id="forme-auth-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="forme-auth-password">Password</label>
            <input
              id="forme-auth-password"
              name="password"
              type="password"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === 'sign-up' ? <small className={styles.hint}>{PASSWORD_HINT}</small> : null}
          </div>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.footnote}>
          Email and password work today. Google and GitHub sign-in appear once their client credentials are configured.
        </p>
      </section>

      <aside className={styles.aside} aria-hidden="true">
        <p className={styles.asideKicker}>Private by default</p>
        <ul className={styles.asideList}>
          <li>Semantic canvases saved per project</li>
          <li>Desktop, tablet, and mobile from one node</li>
          <li>Provider keys encrypted with your own key</li>
        </ul>
      </aside>
    </div>
  )
}