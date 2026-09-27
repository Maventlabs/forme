import { getServerSession } from '@/lib/server-session'
import { getOwnedGenerationJob } from '@/lib/generation-persistence'
import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ idempotencyKey: string }> }) {
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const { idempotencyKey } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return providerJson({ error: 'GENERATION_NOT_FOUND' }, 404)
  }

  try {
    const job = await getOwnedGenerationJob(session.user.id, idempotencyKey)
    if (!job) return providerJson({ error: 'GENERATION_NOT_FOUND' }, 404)
    return providerJson({ job })
  } catch {
    return providerJson({ error: 'GENERATION_STATUS_UNAVAILABLE' }, 503)
  }
}
