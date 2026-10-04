// Centralized secret redaction.
//
// Every structured log value passes through here. Redaction is applied by key
// name and by value shape, so a secret cannot leak even if a caller logs a
// whole request body or a provider error object.

const SECRET_KEY_PATTERN = /(api[-_]?key|apikey|secret|password|passwd|token|authorization|auth[-_]?header|credential|private[-_]?key|session[-_]?id|cookie|signature|dsn)/i

/** Values that look like credentials regardless of the key they were logged under. */
const SECRET_VALUE_PATTERNS: RegExp[] = [
  /\bAIza[0-9A-Za-z_-]{20,}\b/g, // Google API keys
  /\bsk-[A-Za-z0-9_-]{16,}\b/g, // OpenAI-style keys
  /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key ids
  /\bpostgres(?:ql)?:\/\/[^\s"']*:[^\s"'@]+@[^\s"']+/gi, // connection strings
  /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi, // bearer headers
]

export const REDACTED = '[REDACTED]'

const MAX_DEPTH = 6
const MAX_ARRAY_ITEMS = 20
const MAX_STRING_LENGTH = 500

export function redactString(value: string) {
  let output = value
  for (const pattern of SECRET_VALUE_PATTERNS) {
    output = output.replace(pattern, REDACTED)
  }
  if (output.length > MAX_STRING_LENGTH) {
    output = `${output.slice(0, MAX_STRING_LENGTH)}…[truncated]`
  }
  return output
}

/**
 * Recursively redact an arbitrary value for logging.
 * Secret-looking keys are replaced wholesale; long strings are truncated.
 */
export function redactForLog(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value
  if (depth > MAX_DEPTH) return '[DEPTH_LIMIT]'

  if (typeof value === 'string') return redactString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'function' || typeof value === 'symbol') return `[${typeof value}]`

  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      ...('code' in value && typeof (value as { code?: unknown }).code === 'string'
        ? { code: (value as { code?: string }).code }
        : {}),
    }
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redactForLog(item, depth + 1))
    if (value.length > MAX_ARRAY_ITEMS) items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`)
    return items
  }

  if (value instanceof Map) {
    return Object.fromEntries([...value.entries()].slice(0, MAX_ARRAY_ITEMS).map(([key, entry]) => [String(key), redactForLog(entry, depth + 1)]))
  }
  if (value instanceof Set) return redactForLog([...value], depth)

  const output: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : redactForLog(entry, depth + 1)
  }
  return output
}