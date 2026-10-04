import { providerJson } from '@/lib/provider-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Deployment/build identity probe. Used by the production E2E runner to
// prove it is exercising the freshly built artifact rather than a stale
// server that happens to listen on the same port. Contains no secret.
export function GET() {
  return providerJson({
    ok: true,
    buildId: process.env.FORME_E2E_BUILD_ID ?? null,
    runId: process.env.FORME_E2E_RUN_ID ?? null,
    commit: process.env.FORME_E2E_COMMIT ?? null,
  })
}