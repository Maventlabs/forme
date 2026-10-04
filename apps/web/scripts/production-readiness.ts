// Production-readiness environment assertions.
//
// Verifies the runtime fails fast when required production configuration is
// missing, so a misconfigured deployment cannot silently fall back to a
// development origin. Run directly (not part of `pnpm test`).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getAuth } from '../src/lib/auth'

function main() {
  const env = process.env as Record<string, string | undefined>
  const saved = { NODE_ENV: env.NODE_ENV, BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET, BETTER_AUTH_URL: env.BETTER_AUTH_URL }
  env.NODE_ENV = 'production'
  delete env.BETTER_AUTH_SECRET
  delete env.BETTER_AUTH_URL

  assert.throws(() => getAuth(), /BETTER_AUTH_SECRET is required in production/)

  env.BETTER_AUTH_SECRET = 'x'.repeat(32)
  assert.throws(() => getAuth(), /BETTER_AUTH_URL is required in production/)

  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete env[key]
    else env[key] = value
  }

  // Netlify must never read secrets from a file in the repository.
  const netlifyToml = readFileSync(new URL('../../../netlify.toml', import.meta.url), 'utf8')
  for (const secretName of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'PROVIDER_SECRET_ENCRYPTION_KEY', 'S3_SECRET_ACCESS_KEY']) {
    const assignment = new RegExp(`^\\s*${secretName}\\s*=`, 'm')
    assert.equal(assignment.test(netlifyToml), false, `netlify.toml must not declare ${secretName}`)
  }

  process.stdout.write('PASS | production env fails fast and netlify.toml declares no secrets\n')
}

main()