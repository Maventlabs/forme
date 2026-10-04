import { getServerSession } from '@/lib/server-session'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { connectProviderInputSchema } from '@/lib/provider-input'
import { assertProviderEncryptionConfigured } from '@/lib/provider-secrets'
import { getProviderAdapter } from '@/lib/provider-adapters'
import type { ProviderModel } from '@/lib/provider-types'
import { persistProviderConnection, recordProviderValidationAttempt } from '@/lib/provider-service'
import { getRequestId, providerFailure, providerJson } from '@/lib/provider-http'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestId = await getRequestId()
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) {
    log.warn('auth.security_rejection', { route: '/api/providers/connect', reason: invalidMutation.status }, requestId)
    return invalidMutation
  }
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/providers/connect' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, body.status)
  const input = connectProviderInputSchema.safeParse(body.value)
  if (!input.success) return providerJson({ error: 'INVALID_PROVIDER_CONNECTION' }, 422)
  const adapter = getProviderAdapter(input.data.provider)
  if (!adapter) return providerJson({ error: 'PROVIDER_NOT_AVAILABLE' }, 422)

  try {
    assertProviderEncryptionConfigured()
  } catch {
    return providerJson({ error: 'PROVIDER_STORAGE_UNAVAILABLE' }, 503)
  }

  try {
    if (!await recordProviderValidationAttempt(session.user.id, input.data.provider)) {
      return providerJson({ error: 'PROVIDER_RATE_LIMITED' }, 429)
    }
  } catch {
    return providerJson({ error: 'PROVIDER_STORAGE_UNAVAILABLE' }, 503)
  }

  let models: ProviderModel[]
  log.info('provider.request_started', { provider: input.data.provider, operation: 'validate_credentials' }, requestId)
  try {
    models = await adapter.validateCredentials({
      apiKey: input.data.apiKey,
      configuration: { ...(input.data.baseUrl ? { baseUrl: input.data.baseUrl } : {}), ...(input.data.modelId ? { modelId: input.data.modelId } : {}) },
    })
  } catch (error) {
    return providerFailure(error, { provider: input.data.provider, operation: 'validate_credentials', requestId })
  }

  try {
    const connection = await persistProviderConnection({
      userId: session.user.id,
      provider: input.data.provider,
      apiKey: input.data.apiKey,
      configuration: { ...(input.data.baseUrl ? { baseUrl: input.data.baseUrl } : {}), ...(input.data.modelId ? { modelId: input.data.modelId } : {}) },
      models,
    })
    log.info('provider.connection_saved', {
      provider: input.data.provider,
      connectionId: connection.id,
      modelCount: models.length,
    }, requestId)
    return providerJson({ connection }, 201)
  } catch {
    log.error('provider.request_failed', { provider: input.data.provider, operation: 'persist_connection' }, requestId)
    return providerJson({ error: 'PROVIDER_CONNECTION_SAVE_FAILED' }, 503)
  }
}
