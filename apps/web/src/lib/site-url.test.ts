import assert from 'node:assert/strict'
import test from 'node:test'
import { getSiteUrl } from './site-url'

test('resolves the canonical site origin without throwing', () => {
  const env = process.env as Record<string, string | undefined>
  const previous = { SITE_URL: env.SITE_URL, BETTER_AUTH_URL: env.BETTER_AUTH_URL }
  try {
    env.SITE_URL = 'https://forme.example/blog/'
    env.BETTER_AUTH_URL = 'https://auth.example'
    assert.equal(getSiteUrl(), 'https://forme.example')

    delete env.SITE_URL
    assert.equal(getSiteUrl(), 'https://auth.example')

    env.BETTER_AUTH_URL = 'not-a-url'
    assert.equal(getSiteUrl(), 'http://localhost:3100')

    delete env.BETTER_AUTH_URL
    assert.equal(getSiteUrl(), 'http://localhost:3100')
  } finally {
    if (previous.SITE_URL === undefined) delete env.SITE_URL
    else env.SITE_URL = previous.SITE_URL
    if (previous.BETTER_AUTH_URL === undefined) delete env.BETTER_AUTH_URL
    else env.BETTER_AUTH_URL = previous.BETTER_AUTH_URL
  }
})
