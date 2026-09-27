const maxJsonBytes = 256 * 1024

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415 }

export type MutationRequestResult =
  | { ok: true }
  | { ok: false; status: 403 | 415; error: 'INVALID_ORIGIN' | 'JSON_REQUIRED' }

export function validateMutationRequest(
  request: Request,
  options: { expectedOrigin?: string | null; requireJson?: boolean } = {},
): MutationRequestResult {
  const configuredOrigin = options.expectedOrigin === undefined
    ? process.env.BETTER_AUTH_URL ?? (process.env.NODE_ENV === 'production' ? null : 'http://localhost:3100')
    : options.expectedOrigin
  let expectedOrigin: string | null = null
  try {
    if (configuredOrigin) expectedOrigin = new URL(configuredOrigin).origin
  } catch {
    expectedOrigin = null
  }

  const origin = request.headers.get('origin')
  if (!expectedOrigin || !origin || origin !== expectedOrigin) {
    return { ok: false, status: 403, error: 'INVALID_ORIGIN' }
  }

  if (options.requireJson !== false) {
    const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
    if (mediaType !== 'application/json') return { ok: false, status: 415, error: 'JSON_REQUIRED' }
  }

  return { ok: true }
}

export function mutationFailureResponse(request: Request, requireJson = true): Response | null {
  const result = validateMutationRequest(request, { requireJson })
  if (result.ok) return null
  return Response.json({ error: result.error }, {
    status: result.status,
    headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
  })
}

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') return { ok: false, status: 415 }

  const rawContentLength = request.headers.get('content-length')
  const contentLength = rawContentLength === null ? 0 : Number(rawContentLength)
  if (rawContentLength !== null && (!Number.isSafeInteger(contentLength) || contentLength < 0)) {
    return { ok: false, status: 400 }
  }
  if (contentLength > maxJsonBytes) return { ok: false, status: 413 }
  if (!request.body) return { ok: false, status: 400 }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxJsonBytes) {
        await reader.cancel().catch(() => undefined)
        return { ok: false, status: 413 }
      }
      chunks.push(value)
    }

    const bytes = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const body = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { ok: true, value: JSON.parse(body) as unknown }
  } catch {
    return { ok: false, status: 400 }
  } finally {
    reader.releaseLock()
  }
}
