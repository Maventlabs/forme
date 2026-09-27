import { getServerSession } from '@/lib/server-session'
import { listOwnedProviderConnections } from '@/lib/provider-service'
import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  try {
    const connections = await listOwnedProviderConnections(session.user.id)
    return providerJson({ connections })
  } catch {
    return providerJson({ error: 'PROVIDERS_UNAVAILABLE' }, 503)
  }
}
