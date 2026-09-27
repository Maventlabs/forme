import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { schema } from './schema'

const poolKey = Symbol.for('forme.postgres.pool')
type PoolGlobal = typeof globalThis & { [poolKey]?: Pool }

export function getPool() {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) throw new Error('DATABASE_URL is required')

  const root = globalThis as PoolGlobal
  root[poolKey] ??= new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    application_name: 'forme-web',
  })
  return root[poolKey]
}

export function getDb() {
  return drizzle({ client: getPool(), schema })
}
