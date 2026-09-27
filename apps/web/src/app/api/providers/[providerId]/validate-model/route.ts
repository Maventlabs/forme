import { getServerSession } from '@/lib/server-session'
import { providerIdSchema, validateProviderModelInputSchema } from '@/lib/provider-input'
import { mutationFailureResponse, readJsonBody } from '@/lib/http-json'
import { getProviderAdapter } from '@/lib/provider-adapters'
import { getOwnedProviderConnection, replaceProviderModelCache, listOwnedProviderConnections } from '@/lib/provider-service'
import { providerFailure, providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const { providerId } = await params
  const parsedProvider = providerIdSchema.safeParse(providerId)
  if (!parsedProvider.success) return providerJson({ error: 'PROVIDER_NOT_FOUND' }, 404)
  const adapter = getProviderAdapter(parsedProvider.data)
  if (!adapter) return providerJson({ error: 'PROVIDER_NOT_FOUND' }, 404)

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : body.status === 415 ? 'JSON_REQUIRED' : 'INVALID_JSON' }, body.status)
  const parsedInput = validateProviderModelInputSchema.safeParse(body.value)
  if (!parsedInput.success) return providerJson({ error: 'INVALID_MODEL_ID' }, 422)

  try {
    const connection = await getOwnedProviderConnection(session.user.id, parsedProvider.data)
    if (!connection) return providerJson({ error: 'PROVIDER_NOT_CONNECTED' }, 404)
    const model = await adapter.validateModel({ apiKey: connection.apiKey, configuration: connection.configuration }, parsedInput.data.modelId)
    const owned = await listOwnedProviderConnections(session.user.id)
    const current = owned.find((c) => c.provider === parsedProvider.data)?.models ?? []
    const merged = new Map(current.map((m) => [m.id, { id: m.id, displayName: m.displayName, description: m.description, capabilities: m.capabilities, status: m.status, ...(m.inputTokenLimit !== undefined ? { inputTokenLimit: m.inputTokenLimit } : {}), ...(m.outputTokenLimit !== undefined ? { outputTokenLimit: m.outputTokenLimit } : {}) }]))
    merged.set(model.id, model)
    await replaceProviderModelCache(connection.id, [...merged.values()])
    return providerJson({ provider: parsedProvider.data, model })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PROVIDER_SECRET_')) {
      return providerJson({ error: 'PROVIDER_CREDENTIAL_UNAVAILABLE' }, 503)
    }
    return providerFailure(error)
  }
}
