import { ProviderAdapterError } from './provider-types'

// Only transient, safe-to-retry conditions are retried. Credential, permission,
// rate-limit, malformed-output and client errors are terminal: retrying them
// would waste provider quota and hide a real failure from the user.
const retryableCodes = new Set(['PROVIDER_TIMEOUT', 'PROVIDER_UNAVAILABLE'])

export function isRetryableProviderError(error: unknown) {
  return error instanceof ProviderAdapterError && retryableCodes.has(error.code)
}

export type ProviderRetryPolicy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  sleep?: (ms: number) => Promise<void>
}

export const defaultProviderRetryPolicy: ProviderRetryPolicy = {
  maxAttempts: 2,
  baseDelayMs: 250,
  maxDelayMs: 2_000,
}

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Bounded retry with capped exponential backoff and jitter.
 * There is never an unbounded loop: `maxAttempts` is enforced, and the final
 * failure is rethrown unchanged so callers keep the real error code/status.
 */
export async function withBoundedProviderRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: ProviderRetryPolicy = defaultProviderRetryPolicy,
): Promise<T> {
  const sleep = policy.sleep ?? defaultSleep
  const maxAttempts = Math.max(1, Math.min(3, Math.trunc(policy.maxAttempts)))

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts || !isRetryableProviderError(error)) throw error
      const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1))
      await sleep(exponential + Math.floor(Math.random() * 100))
    }
  }
  throw lastError
}