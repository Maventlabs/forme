import { and, count, eq, gte, lt, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { aiGenerationJobs, projects } from '@/db/schema'
import type { CanvasDocument } from '@forme/design-ir'

const maxGenerationsPerHour = 10
const staleRunningMs = 2 * 60 * 1_000
const jobRetentionMs = 30 * 24 * 60 * 60 * 1_000

export type GenerationJobClaim =
  | { state: 'claimed'; jobId: string }
  | { state: 'replay'; jobId: string; status: 'succeeded' | 'failed' | 'unknown'; resultRevision: number | null; errorCode: string | null }
  | { state: 'in-progress'; jobId: string }
  | { state: 'rate-limited' }
  | { state: 'idempotency-conflict' }

export async function claimGenerationJob(input: {
  userId: string
  projectId: string
  nodeId: string
  idempotencyKey: string
  requestHash: string
  provider: string
  modelId: string
}) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1_000)
  const staleBefore = new Date(now.getTime() - staleRunningMs)
  const expiredBefore = new Date(now.getTime() - jobRetentionMs)

  return getDb().transaction(async (transaction): Promise<GenerationJobClaim> => {
    await transaction.update(aiGenerationJobs)
      .set({ status: 'unknown', errorCode: 'OUTCOME_UNKNOWN', updatedAt: now })
      .where(and(
        eq(aiGenerationJobs.userId, input.userId),
        eq(aiGenerationJobs.status, 'running'),
        lt(aiGenerationJobs.createdAt, staleBefore),
      ))
    await transaction.delete(aiGenerationJobs).where(and(
      eq(aiGenerationJobs.userId, input.userId),
      lt(aiGenerationJobs.createdAt, expiredBefore),
    ))

    const [usage] = await transaction.select({ total: count() }).from(aiGenerationJobs).where(and(
      eq(aiGenerationJobs.userId, input.userId),
      gte(aiGenerationJobs.createdAt, hourAgo),
    ))
    if ((usage?.total ?? 0) >= maxGenerationsPerHour) return { state: 'rate-limited' }

    const [created] = await transaction.insert(aiGenerationJobs).values({
      userId: input.userId,
      projectId: input.projectId,
      nodeId: input.nodeId,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      provider: input.provider,
      modelId: input.modelId,
      status: 'running',
    }).onConflictDoNothing().returning({ id: aiGenerationJobs.id })
    if (created) return { state: 'claimed', jobId: created.id }

    const [existing] = await transaction.select({
      id: aiGenerationJobs.id,
      requestHash: aiGenerationJobs.requestHash,
      status: aiGenerationJobs.status,
      resultRevision: aiGenerationJobs.resultRevision,
      errorCode: aiGenerationJobs.errorCode,
    }).from(aiGenerationJobs).where(and(
      eq(aiGenerationJobs.userId, input.userId),
      eq(aiGenerationJobs.idempotencyKey, input.idempotencyKey),
    )).limit(1)

    if (existing) {
      if (existing.requestHash !== input.requestHash) return { state: 'idempotency-conflict' }
      if (existing.status === 'running') return { state: 'in-progress', jobId: existing.id }
      return {
        state: 'replay',
        jobId: existing.id,
        status: existing.status as 'succeeded' | 'failed' | 'unknown',
        resultRevision: existing.resultRevision,
        errorCode: existing.errorCode,
      }
    }

    const [running] = await transaction.select({ id: aiGenerationJobs.id }).from(aiGenerationJobs).where(and(
      eq(aiGenerationJobs.userId, input.userId),
      eq(aiGenerationJobs.status, 'running'),
    )).limit(1)
    if (running) return { state: 'in-progress', jobId: running.id }
    return { state: 'rate-limited' }
  })
}

export async function completeGenerationJob(input: {
  jobId: string
  userId: string
  projectId: string
  expectedRevision: number
  canvas: CanvasDocument
}) {
  const updatedAt = new Date()
  return getDb().transaction(async (transaction) => {
    const [savedProject] = await transaction.update(projects).set({
      canvas: input.canvas,
      canvasRevision: sql`${projects.canvasRevision} + 1`,
      updatedAt,
    }).where(and(
      eq(projects.id, input.projectId),
      eq(projects.userId, input.userId),
      eq(projects.canvasRevision, input.expectedRevision),
    )).returning({ revision: projects.canvasRevision })

    if (!savedProject) {
      await transaction.update(aiGenerationJobs).set({ status: 'failed', errorCode: 'REVISION_CONFLICT', updatedAt }).where(and(
        eq(aiGenerationJobs.id, input.jobId),
        eq(aiGenerationJobs.userId, input.userId),
        eq(aiGenerationJobs.status, 'running'),
      ))
      return null
    }

    const [completed] = await transaction.update(aiGenerationJobs).set({
      status: 'succeeded',
      resultRevision: savedProject.revision,
      errorCode: null,
      updatedAt,
    }).where(and(
      eq(aiGenerationJobs.id, input.jobId),
      eq(aiGenerationJobs.userId, input.userId),
      eq(aiGenerationJobs.status, 'running'),
    )).returning({ id: aiGenerationJobs.id })

    if (!completed) throw new Error('GENERATION_JOB_STATE_CONFLICT')
    return savedProject.revision
  })
}

export async function finishGenerationJob(input: { jobId: string; userId: string; status: 'failed' | 'unknown'; errorCode: string }) {
  await getDb().update(aiGenerationJobs).set({
    status: input.status,
    errorCode: input.errorCode,
    updatedAt: new Date(),
  }).where(and(
    eq(aiGenerationJobs.id, input.jobId),
    eq(aiGenerationJobs.userId, input.userId),
    eq(aiGenerationJobs.status, 'running'),
  ))
}

export async function getOwnedGenerationJob(userId: string, idempotencyKey: string) {
  const [job] = await getDb().select({
    id: aiGenerationJobs.id,
    projectId: aiGenerationJobs.projectId,
    nodeId: aiGenerationJobs.nodeId,
    status: aiGenerationJobs.status,
    resultRevision: aiGenerationJobs.resultRevision,
    errorCode: aiGenerationJobs.errorCode,
    createdAt: aiGenerationJobs.createdAt,
    updatedAt: aiGenerationJobs.updatedAt,
  }).from(aiGenerationJobs).where(and(
    eq(aiGenerationJobs.idempotencyKey, idempotencyKey),
    eq(aiGenerationJobs.userId, userId),
  )).limit(1)
  return job ?? null
}

export async function getOwnedGenerationJobForRequest(userId: string, idempotencyKey: string) {
  const [job] = await getDb().select({
    id: aiGenerationJobs.id,
    projectId: aiGenerationJobs.projectId,
    requestHash: aiGenerationJobs.requestHash,
    status: aiGenerationJobs.status,
    resultRevision: aiGenerationJobs.resultRevision,
    errorCode: aiGenerationJobs.errorCode,
  }).from(aiGenerationJobs).where(and(
    eq(aiGenerationJobs.userId, userId),
    eq(aiGenerationJobs.idempotencyKey, idempotencyKey),
  )).limit(1)
  return job ?? null
}
