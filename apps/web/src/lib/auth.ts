import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { getDb } from '@/db'
import { schema } from '@/db/schema'

// Lazy initialization on purpose: Next.js imports route modules during
// `next build` (page-data collection) where production secrets may not be
// configured yet (e.g. Netlify build without runtime env). Secrets are
// validated fail-fast when the first request actually needs auth, never at
// import time, so static/landing builds are not blocked unnecessarily.
function createAuth() {
  const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3100'
  const secret = process.env.BETTER_AUTH_SECRET

  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('BETTER_AUTH_SECRET is required in production')
  }

  return betterAuth({
    appName: 'FORME by Mavent',
    baseURL,
    secret,
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    trustedOrigins: [baseURL],
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
    },
  })
}

type AuthInstance = ReturnType<typeof createAuth>

let cached: AuthInstance | undefined

export function getAuth(): AuthInstance {
  cached ??= createAuth()
  return cached
}
