import { getServerSession } from '@/lib/server-session'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { connectProviderInputSchema } from '@/lib/provider-input'
import { assertProviderEncryptionConfigured } from '@/lib/provider-secrets'
import { getProviderAdapter } from '@/lib/provider-adapters'
import type { ProviderModel } from '@/lib/provider-types'
import { persistProviderConnection, recordProviderValidationAttempt } from '@/lib/provider-service'
import { providerFailure, providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

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
  try {
    models = await adapter.validateCredentials({
      apiKey: input.data.apiKey,
      configuration: { ...(input.data.baseUrl ? { baseUrl: input.data.baseUrl } : {}), ...(input.data.modelId ? { modelId: input.data.modelId } : {}) },
    })
  } catch (error) {
    return providerFailure(error)
  }

  try {
    const connection = await persistProviderConnection({
      userId: session.user.id,
      provider: input.data.provider,
      apiKey: input.data.apiKey,
      configuration: { ...(input.data.baseUrl ? { baseUrl: input.data.baseUrl } : {}), ...(input.data.modelId ? { modelId: input.data.modelId } : {}) },
      models,
    })
    return providerJson({ connection }, 201)
  } catch {
    return providerJson({ error: 'PROVIDER_CONNECTION_SAVE_FAILED' }, 503)
  }
}
