import { ProviderAdapterError } from './provider-types'

export function providerJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
  })
}

export function providerFailure(error: unknown) {
  if (error instanceof ProviderAdapterError) {
    return providerJson({ error: error.code, ...(error.providerStatus ? { providerStatus: error.providerStatus } : {}) }, error.status)
  }
  return providerJson({ error: 'PROVIDER_UNAVAILABLE' }, 503)
}
