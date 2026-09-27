import { getServerSession } from '@/lib/server-session'
import { providerIdSchema } from '@/lib/provider-input'
import { getProviderAdapter } from '@/lib/provider-adapters'
import type { ProviderModel } from '@/lib/provider-types'
import { getOwnedProviderConnection, recordProviderValidationAttempt, replaceProviderModelCache } from '@/lib/provider-service'
import { providerFailure, providerJson } from '@/lib/provider-http'
import { mutationFailureResponse } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const invalidMutation = mutationFailureResponse(request, false)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const { providerId } = await params
  const parsedProvider = providerIdSchema.safeParse(providerId)
  if (!parsedProvider.success) return providerJson({ error: 'PROVIDER_NOT_FOUND' }, 404)
  const adapter = getProviderAdapter(parsedProvider.data)
  if (!adapter) return providerJson({ error: 'PROVIDER_NOT_FOUND' }, 404)

  try {
    const connection = await getOwnedProviderConnection(session.user.id, parsedProvider.data)
    if (!connection) return providerJson({ error: 'PROVIDER_NOT_CONNECTED' }, 404)
    if (!await recordProviderValidationAttempt(session.user.id, parsedProvider.data)) {
      return providerJson({ error: 'PROVIDER_RATE_LIMITED' }, 429)
    }

    const models: ProviderModel[] = await adapter.listModels({ apiKey: connection.apiKey, configuration: connection.configuration })
    const syncedAt = await replaceProviderModelCache(connection.id, models)
    return providerJson({ provider: parsedProvider.data, models, syncedAt })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('PROVIDER_SECRET_')) {
      return providerJson({ error: 'PROVIDER_CREDENTIAL_UNAVAILABLE' }, 503)
    }
    return providerFailure(error)
  }
}
