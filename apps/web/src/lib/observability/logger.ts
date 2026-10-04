import { headers } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { redactForLog } from './redact'

// Structured server-side logging.
//
// FORME has no Sentry wiring yet, so this is the single logging surface that a
// future error-monitoring integration can consume: every line is a redacted
// JSON object with a stable `event` name, a level, and a correlation id.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEvent =
  | 'auth.rejected'
  | 'auth.security_rejection'
  | 'provider.request_started'
  | 'provider.request_succeeded'
  | 'provider.request_failed'
  | 'provider.credential_rejected'
  | 'provider.connection_saved'
  | 'provider.connection_deleted'
  | 'provider.models_synced'
  | 'ai.generation_started'
  | 'ai.generation_succeeded'
  | 'ai.generation_failed'
  | 'ai.job_replayed'
  | 'storage.upload_prepared'
  | 'storage.upload_failed'
  | 'storage.asset_confirmed'
  | 'storage.asset_deleted'
  | 'share.created'
  | 'share.revoked'
  | 'share.resolved'
  | 'export.succeeded'
  | 'export.failed'
  | 'design_context.applied'
  | 'preset.applied'
  | 'request.failed'

type LogFields = Record<string, unknown>

const levelRank: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const minimumLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info'

let requestId: string | undefined

/** Correlation id for the current request, used by every log line it emits. */
export async function getRequestId() {
  if (requestId) return requestId
  try {
    const headerList = await headers()
    const incoming = headerList.get('x-request-id')
    requestId = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID()
  } catch {
    requestId = randomUUID()
  }
  return requestId
}

function emit(level: LogLevel, event: LogEvent, fields: LogFields, correlationId?: string) {
  if (levelRank[level] < levelRank[minimumLevel]) return

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(correlationId ? { requestId: correlationId } : {}),
    ...(redactForLog(fields) as LogFields),
  }

  const line = JSON.stringify(entry)
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

function safeCorrelationId(correlationId?: string) {
  if (!correlationId) return undefined
  return /^[\w-]{1,64}$/.test(correlationId) ? correlationId : undefined
}

export const log = {
  debug: (event: LogEvent, fields: LogFields = {}, correlationId?: string) => emit('debug', event, fields, safeCorrelationId(correlationId)),
  info: (event: LogEvent, fields: LogFields = {}, correlationId?: string) => emit('info', event, fields, safeCorrelationId(correlationId)),
  warn: (event: LogEvent, fields: LogFields = {}, correlationId?: string) => emit('warn', event, fields, safeCorrelationId(correlationId)),
  error: (event: LogEvent, fields: LogFields = {}, correlationId?: string) => emit('error', event, fields, safeCorrelationId(correlationId)),
}

/** Reset the memoized request id. Test-only. */
export function resetRequestIdForTests() {
  requestId = undefined
}