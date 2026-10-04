import { ProviderAdapterError } from './provider-types'
import { getRequestId, log } from './observability/logger'

export function providerJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
  })
}

/**
 * Map a provider/adapter failure to a user-safe response while keeping useful
 * internal diagnostics in the structured log. Provider status codes are
 * forwarded because they are not sensitive, but provider response bodies,
 * endpoints and credentials never are.
 */
export function providerFailure(error: unknown, context: Record<string, unknown> = {}) {
  if (error instanceof ProviderAdapterError) {
    const requestId = context.requestId as string | undefined
    const fields: Record<string, unknown> = { ...context }
    delete fields.requestId

    if (error.code === 'INVALID_CREDENTIAL' || error.code === 'PROVIDER_CREDENTIAL_REJECTED') {
      log.warn('provider.credential_rejected', { ...fields, code: error.code, providerStatus: error.providerStatus }, requestId)
    } else if (error.status >= 500 || error.status === 429 || error.outcomeUnknown) {
      log.error('provider.request_failed', { ...fields, code: error.code, providerStatus: error.providerStatus, outcomeUnknown: error.outcomeUnknown }, requestId)
    } else {
      log.info('provider.request_failed', { ...fields, code: error.code, providerStatus: error.providerStatus }, requestId)
    }

    return providerJson(
      { error: error.code, ...(error.providerStatus ? { providerStatus: error.providerStatus } : {}) },
      error.status,
    )
  }

  log.error('provider.request_failed', { ...context, code: 'PROVIDER_UNAVAILABLE', cause: error instanceof Error ? error.message : 'unknown' }, context.requestId as string | undefined)
  return providerJson({ error: 'PROVIDER_UNAVAILABLE' }, 503)
}

export { getRequestId }
