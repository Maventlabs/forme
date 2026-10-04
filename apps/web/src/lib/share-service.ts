import { createHash, randomBytes } from 'node:crypto'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { projects, shareLinks } from '@/db/schema'

const TOKEN_BYTES = 32
const MAX_SHARES_PER_PROJECT = 25
const MAX_EXPIRY_DAYS = 90

export type CreatedShareLink = {
  id: string
  token: string
  tokenPrefix: string
  expiresAt: Date | null
  createdAt: Date
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

/** Only a short, non-secret prefix is stored for owner-visible identification. */
function tokenPrefix(token: string) {
  return token.slice(0, 8)
}

export async function createShareLink(userId: string, projectId: string, expiresInDays: number | null) {
  if (!Number.isInteger(expiresInDays ?? 0) && expiresInDays !== null) throw new Error('SHARE_EXPIRY_INVALID')
  if (expiresInDays !== null && (expiresInDays! < 1 || expiresInDays! > MAX_EXPIRY_DAYS)) throw new Error('SHARE_EXPIRY_INVALID')

  const db = getDb()
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  if (!owned) throw new Error('PROJECT_NOT_FOUND')

  const existing = await db
    .select({ id: shareLinks.id })
    .from(shareLinks)
    .where(and(eq(shareLinks.projectId, projectId), sql`${shareLinks.revokedAt} IS NULL`))
  if (existing.length >= MAX_SHARES_PER_PROJECT) throw new Error('SHARE_LIMIT_REACHED')

  // The raw token is returned exactly once; only its hash is persisted.
  const token = randomBytes(TOKEN_BYTES).toString('base64url')
  const now = new Date()
  const expiresAt = expiresInDays === null ? null : new Date(now.getTime() + expiresInDays! * 24 * 60 * 60 * 1_000)

  const [created] = await db
    .insert(shareLinks)
    .values({ projectId, ownerId: userId, tokenHash: hashToken(token), tokenPrefix: tokenPrefix(token), expiresAt })
    .returning({ id: shareLinks.id, tokenPrefix: shareLinks.tokenPrefix, expiresAt: shareLinks.expiresAt, createdAt: shareLinks.createdAt })

  if (!created) throw new Error('SHARE_CREATE_FAILED')
  return { ...created, token } satisfies CreatedShareLink
}

export async function listShareLinks(userId: string, projectId: string) {
  return getDb()
    .select({
      id: shareLinks.id,
      tokenPrefix: shareLinks.tokenPrefix,
      expiresAt: shareLinks.expiresAt,
      revokedAt: shareLinks.revokedAt,
      viewCount: shareLinks.viewCount,
      createdAt: shareLinks.createdAt,
    })
    .from(shareLinks)
    .where(and(eq(shareLinks.projectId, projectId), eq(shareLinks.ownerId, userId)))
    .orderBy(desc(shareLinks.createdAt))
}

export async function revokeShareLink(userId: string, projectId: string, shareId: string) {
  const [revoked] = await getDb()
    .update(shareLinks)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(shareLinks.id, shareId),
      eq(shareLinks.projectId, projectId),
      eq(shareLinks.ownerId, userId),
      isNull(shareLinks.revokedAt),
    ))
    .returning({ id: shareLinks.id })
  return Boolean(revoked)
}

export type SharedProjectView = {
  shareId: string
  project: { name: string; canvas: unknown }
  sharedAt: Date
}

/**
 * Resolve a public share token. Only a sanitized, read-only projection of the
 * canvas is returned: no owner identity, no provider connections, no
 * generation jobs, no credentials.
 */
export async function resolveSharedProject(token: string): Promise<SharedProjectView | null> {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return null
  const tokenHash = hashToken(token)

  const [link] = await getDb()
    .select({
      id: shareLinks.id,
      projectId: shareLinks.projectId,
      expiresAt: shareLinks.expiresAt,
      revokedAt: shareLinks.revokedAt,
    })
    .from(shareLinks)
    .where(eq(shareLinks.tokenHash, tokenHash))
    .limit(1)

  if (!link || link.revokedAt) return null
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return null

  const [project] = await getDb()
    .select({ name: projects.name, canvas: projects.canvas })
    .from(projects)
    .where(eq(projects.id, link.projectId))
    .limit(1)
  if (!project) return null

  await getDb()
    .update(shareLinks)
    .set({ viewCount: sql`${shareLinks.viewCount} + 1`, updatedAt: new Date() })
    .where(eq(shareLinks.id, link.id))

  return { shareId: link.id, project, sharedAt: new Date() }
}