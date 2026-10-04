import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { aiGenerationJobs } from '@/db/schema'

// Database-backed fixed-window rate limiting.
//
// FORME deliberately avoids a new Redis dependency at this stage: the primary
// database is already a required runtime dependency, and this keeps the abuse
// control honest for the synchronous API surface. Long-running worker limits
// belong with the future job architecture.

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  limit: number
  retryAfterSeconds: number
}

export type RateLimitRule = {
  /** Stable key namespace, e.g. `share:create`. */
  action: string
  limit: number
  windowSeconds: number
}

const defaultRule = (action: string, limit: number, windowSeconds: number): RateLimitRule => ({ action, limit, windowSeconds })

export const rateLimitRules = {
  shareCreate: defaultRule('share:create', 20, 60 * 60),
  shareRevoke: defaultRule('share:revoke', 40, 60 * 60),
  exportGenerate: defaultRule('export:generate', 30, 60 * 60),
  assetPrepare: defaultRule('asset:prepare', 60, 60 * 60),
  designContextApply: defaultRule('design-context:apply', 40, 60 * 60),
  presetApply: defaultRule('preset:apply', 40, 60 * 60),
} satisfies Record<string, RateLimitRule>

/**
 * Count recent generation jobs for a user as a rate-limit signal.
 * Reuses the existing generation job ledger so no extra table is required.
 */
export async function checkGenerationRate(userId: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowSeconds * 1_000)
  const [row] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(aiGenerationJobs)
    .where(and(eq(aiGenerationJobs.userId, userId), sql`${aiGenerationJobs.createdAt} >= ${windowStart}`))

  const total = Number(row?.total ?? 0)
  return {
    allowed: total < limit,
    remaining: Math.max(0, limit - total),
    limit,
    retryAfterSeconds: total < limit ? 0 : windowSeconds,
  }
}

/**
 * In-process fixed-window limiter for cheap endpoints.
 *
 * Deliberately single-instance: it protects a Netlify function from bursts
 * and obvious abuse loops, while authoritative per-user limits stay in the
 * database. Multi-instance deployments must not treat this as a hard limit.
 */
const windows = new Map<string, { count: number; resetAt: number }>()

export function checkInProcessRate(rule: RateLimitRule, identity: string): RateLimitResult {
  const now = Date.now()
  const key = `${rule.action}:${identity}`
  const existing = windows.get(key)

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + rule.windowSeconds * 1_000 })
    return { allowed: true, remaining: rule.limit - 1, limit: rule.limit, retryAfterSeconds: 0 }
  }

  existing.count += 1
  const allowed = existing.count <= rule.limit
  return {
    allowed,
    remaining: Math.max(0, rule.limit - existing.count),
    limit: rule.limit,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((existing.resetAt - now) / 1_000)),
  }
}

export function resetInProcessRateForTests() {
  windows.clear()
}