import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '@/lib/auth'

export const runtime = 'nodejs'

// Resolved per request (not at module scope) so `next build` page-data
// collection never requires production secrets to be configured.
type Handlers = ReturnType<typeof toNextJsHandler>
let cached: Handlers | undefined

function handlers(): Handlers {
  cached ??= toNextJsHandler(getAuth())
  return cached
}

export function GET(request: Request) {
  return handlers().GET(request)
}

export function POST(request: Request) {
  return handlers().POST(request)
}
