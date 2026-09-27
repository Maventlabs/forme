// Build-environment safety proof (not part of `pnpm test`).
// Simulates a production build host (e.g. Netlify) where secrets are NOT
// configured: importing auth modules must not throw; the fail-fast error
// must only surface when auth is actually initialized for a request.
import assert from 'node:assert/strict'
import { getAuth } from '../src/lib/auth'

function main() {
  const env = process.env as Record<string, string | undefined>
  env.NODE_ENV = 'production'
  delete env.BETTER_AUTH_SECRET
  delete env.DATABASE_URL
  delete env.BETTER_AUTH_URL

  assert.equal(typeof getAuth, 'function', 'auth module must export lazy getAuth')

  assert.throws(
    () => getAuth(),
    /BETTER_AUTH_SECRET is required in production/,
    'first request-time init without secret must fail fast with the secret error',
  )

  process.stdout.write('PASS | auth module import is build-safe; secret validated fail-fast at request time\n')
}

main()
