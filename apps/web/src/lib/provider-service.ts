import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { modelCache, providerConnections } from '@/db/schema'
import { decryptProviderSecret, encryptProviderSecret } from './provider-secrets'
import type { ProviderConfiguration, ProviderModel } from './provider-types'

function encodeStoredSecret(apiKey: string, configuration: ProviderConfiguration) {
  return JSON.stringify({ v: 1, apiKey, baseUrl: configuration.baseUrl ?? null, modelId: configuration.modelId ?? null })
}

function decodeStoredSecret(raw: string): { apiKey: string; configuration: ProviderConfiguration } {
  try {
    const parsed = JSON.parse(raw) as { v?: number; apiKey?: unknown; baseUrl?: unknown; modelId?: unknown }
    if (typeof parsed.apiKey === 'string' && parsed.apiKey.length > 0) {
      return {
        apiKey: parsed.apiKey,
        configuration: {
          ...(typeof parsed.baseUrl === 'string' && parsed.baseUrl.length > 0 ? { baseUrl: parsed.baseUrl } : {}),
          ...(typeof parsed.modelId === 'string' && parsed.modelId.length > 0 ? { modelId: parsed.modelId } : {}),
        },
      }
    }
  } catch {
    // fall through to legacy raw-key envelope
  }
  return { apiKey: raw, configuration: {} }
}

function withStatus(model: ProviderModel): ProviderModel {
  if (model.status === 'validated' || model.capabilities.includes('structured-output')) {
    return { ...model, capabilities: model.capabilities.includes('structured-output') ? model.capabilities : [...model.capabilities, 'structured-output'], status: 'validated' }
  }
  return { ...model, status: 'discovered' }
}

export const geminiProviderId = 'google-gemini'
const maxValidationAttemptsPerWindow = 5

export async function recordProviderValidationAttempt(userId: string, provider: string) {
  const now = new Date()
  const windowExpired = sql`${providerConnections.validationWindowStartedAt} <= now() - interval '1 hour'`
  const [attempt] = await getDb()
    .insert(providerConnections)
    .values({ userId, provider, validationAttempts: 1 })
    .onConflictDoUpdate({
      target: [providerConnections.userId, providerConnections.provider],
      set: {
        validationAttempts: sql`CASE WHEN ${windowExpired} THEN 1 ELSE ${providerConnections.validationAttempts} + 1 END`,
        validationWindowStartedAt: sql`CASE WHEN ${windowExpired} THEN ${now} ELSE ${providerConnections.validationWindowStartedAt} END`,
        updatedAt: now,
      },
    })
    .returning({ attempts: providerConnections.validationAttempts })

  return (attempt?.attempts ?? maxValidationAttemptsPerWindow + 1) <= maxValidationAttemptsPerWindow
}

export async function persistProviderConnection(input: {
  userId: string
  provider: string
  apiKey: string
  configuration?: ProviderConfiguration
  models: ProviderModel[]
}) {
  const encryptedSecret = encryptProviderSecret(encodeStoredSecret(input.apiKey, input.configuration ?? {}), { ownerId: input.userId, provider: input.provider })
  const verifiedAt = new Date()

  return getDb().transaction(async (transaction) => {
    const [connection] = await transaction
      .insert(providerConnections)
      .values({ userId: input.userId, provider: input.provider, encryptedSecret, verifiedAt, updatedAt: verifiedAt })
      .onConflictDoUpdate({
        target: [providerConnections.userId, providerConnections.provider],
        set: { encryptedSecret, verifiedAt, updatedAt: verifiedAt },
      })
      .returning({ id: providerConnections.id, provider: providerConnections.provider, verifiedAt: providerConnections.verifiedAt })

    if (!connection) throw new Error('PROVIDER_CONNECTION_SAVE_FAILED')

    await transaction.delete(modelCache).where(eq(modelCache.connectionId, connection.id))
    await transaction.insert(modelCache).values(input.models.map((model) => ({
      connectionId: connection.id,
      modelId: model.id,
      displayName: model.displayName,
      description: model.description,
      inputTokenLimit: model.inputTokenLimit ?? null,
      outputTokenLimit: model.outputTokenLimit ?? null,
      capabilities: model.capabilities,
      syncedAt: verifiedAt,
    })))

    return { ...connection, models: input.models.map(withStatus) }
  })
}

export async function replaceProviderModelCache(connectionId: string, models: ProviderModel[]) {
  const syncedAt = new Date()
  await getDb().transaction(async (transaction) => {
    await transaction.delete(modelCache).where(eq(modelCache.connectionId, connectionId))
    await transaction.insert(modelCache).values(models.map((model) => ({
      connectionId,
      modelId: model.id,
      displayName: model.displayName,
      description: model.description,
      inputTokenLimit: model.inputTokenLimit ?? null,
      outputTokenLimit: model.outputTokenLimit ?? null,
      capabilities: model.capabilities,
      syncedAt,
    })))
    await transaction.update(providerConnections).set({ verifiedAt: syncedAt, updatedAt: syncedAt }).where(eq(providerConnections.id, connectionId))
  })
  return syncedAt
}

export async function listOwnedProviderConnections(userId: string) {
  const connections = await getDb()
    .select({ id: providerConnections.id, provider: providerConnections.provider, verifiedAt: providerConnections.verifiedAt })
    .from(providerConnections)
    .where(and(eq(providerConnections.userId, userId), isNotNull(providerConnections.encryptedSecret)))
    .orderBy(desc(providerConnections.verifiedAt))

  if (!connections.length) return []
  const models = await getDb()
    .select({
      connectionId: modelCache.connectionId,
      id: modelCache.modelId,
      displayName: modelCache.displayName,
      description: modelCache.description,
      inputTokenLimit: modelCache.inputTokenLimit,
      outputTokenLimit: modelCache.outputTokenLimit,
      capabilities: modelCache.capabilities,
      syncedAt: modelCache.syncedAt,
    })
    .from(modelCache)
    .where(inArray(modelCache.connectionId, connections.map((connection) => connection.id)))
    .orderBy(modelCache.displayName)

  return connections.map((connection) => ({
    id: connection.id,
    provider: connection.provider,
    verifiedAt: connection.verifiedAt,
    models: models.filter((model) => model.connectionId === connection.id).map((model) => ({
      ...withStatus({
        id: model.id,
        displayName: model.displayName,
        description: model.description,
        ...(model.inputTokenLimit !== null ? { inputTokenLimit: model.inputTokenLimit } : {}),
        ...(model.outputTokenLimit !== null ? { outputTokenLimit: model.outputTokenLimit } : {}),
        capabilities: model.capabilities,
        status: model.capabilities.includes('structured-output') ? 'validated' : 'discovered',
      }),
      syncedAt: model.syncedAt,
    })),
  }))
}

export async function getOwnedProviderConnection(userId: string, provider: string) {
  const [connection] = await getDb()
    .select({ id: providerConnections.id, provider: providerConnections.provider, encryptedSecret: providerConnections.encryptedSecret })
    .from(providerConnections)
    .where(and(
      eq(providerConnections.userId, userId),
      eq(providerConnections.provider, provider),
      isNotNull(providerConnections.encryptedSecret),
    ))
    .limit(1)

  if (!connection?.encryptedSecret) return null
  const models = await getDb()
    .select({ modelId: modelCache.modelId })
    .from(modelCache)
    .where(eq(modelCache.connectionId, connection.id))

  const stored = decodeStoredSecret(decryptProviderSecret(connection.encryptedSecret, { ownerId: userId, provider }))
  return {
    id: connection.id,
    provider: connection.provider,
    apiKey: stored.apiKey,
    configuration: stored.configuration,
    modelIds: models.map((model) => model.modelId),
  }
}

export async function deleteOwnedProviderConnection(userId: string, provider: string) {
  return getDb().transaction(async (transaction) => {
    const [disconnected] = await transaction.update(providerConnections).set({
      encryptedSecret: null,
      verifiedAt: null,
      updatedAt: new Date(),
    }).where(and(
      eq(providerConnections.userId, userId),
      eq(providerConnections.provider, provider),
    )).returning({ id: providerConnections.id })
    if (!disconnected) return false
    await transaction.delete(modelCache).where(eq(modelCache.connectionId, disconnected.id))
    return true
  })
}
