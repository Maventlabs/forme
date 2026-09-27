import { getServerSession } from '@/lib/server-session'
import { providerIdSchema } from '@/lib/provider-input'
import { deleteOwnedProviderConnection } from '@/lib/provider-service'
import { providerJson } from '@/lib/provider-http'
import { mutationFailureResponse } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const invalidMutation = mutationFailureResponse(request, false)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const { providerId } = await params
  const parsedProvider = providerIdSchema.safeParse(providerId)
  if (!parsedProvider.success) return providerJson({ error: 'PROVIDER_NOT_FOUND' }, 404)

  try {
    await deleteOwnedProviderConnection(session.user.id, parsedProvider.data)
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
  } catch {
    return providerJson({ error: 'PROVIDER_DISCONNECT_FAILED' }, 503)
  }
}
