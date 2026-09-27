import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { getDb } from '@/db'
import { schema } from '@/db/schema'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3100'
const secret = process.env.BETTER_AUTH_SECRET

if (process.env.NODE_ENV === 'production' && !secret) {
  throw new Error('BETTER_AUTH_SECRET is required in production')
}

export const auth = betterAuth({
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
