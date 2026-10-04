import { getOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { renderCanvasJson, renderCanvasSvg, type ExportBreakpoint } from '@/lib/export-artifact'
import { getServerSession } from '@/lib/server-session'
import { getRequestId, providerJson } from '@/lib/provider-http'
import { checkInProcessRate, rateLimitRules } from '@/lib/rate-limit'
import { log } from '@/lib/observability/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

const formats = new Set(['json', 'svg'])
const breakpoints = new Set<ExportBreakpoint>(['desktop', 'tablet', 'mobile'])

function contentDisposition(filename: string, extension: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 60) || 'forme-project'
  return `attachment; filename="${safe}.${extension}"`
}

export async function GET(request: Request, { params }: RouteContext) {
  const requestId = await getRequestId()
  const session = await getServerSession()
  if (!session) {
    log.warn('auth.rejected', { route: '/api/projects/:id/export' }, requestId)
    return providerJson({ error: 'UNAUTHORIZED' }, 401)
  }
  const { projectId } = await params

  const rateLimit = checkInProcessRate(rateLimitRules.exportGenerate, session.user.id)
  if (!rateLimit.allowed) {
    log.warn('auth.security_rejection', { route: '/api/projects/:id/export', reason: 'rate_limited' }, requestId)
    return providerJson({ error: 'RATE_LIMITED', retryAfterSeconds: rateLimit.retryAfterSeconds }, 429)
  }

  const url = new URL(request.url)
  const format = url.searchParams.get('format') ?? 'json'
  if (!formats.has(format)) return providerJson({ error: 'INVALID_EXPORT_FORMAT' }, 422)
  const requestedBreakpoint = url.searchParams.get('breakpoint') as ExportBreakpoint | null
  const breakpoint = requestedBreakpoint && breakpoints.has(requestedBreakpoint) ? requestedBreakpoint : 'desktop'

  try {
    const project = await getOwnedProjectCanvas(projectId, session.user.id)
    if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)

    if (format === 'svg') {
      const svg = renderCanvasSvg(project.canvas, { projectName: project.name, breakpoint })
      log.info('export.succeeded', { projectId, format, breakpoint, byteSize: svg.length }, requestId)
      return new Response(svg, {
        status: 200,
        headers: {
          'content-type': 'image/svg+xml; charset=utf-8',
          'content-disposition': contentDisposition(project.name, 'svg'),
          'cache-control': 'no-store',
        },
      })
    }

    const json = renderCanvasJson(project.canvas, { name: project.name, revision: project.revision })
    log.info('export.succeeded', { projectId, format: 'json', revision: project.revision }, requestId)
    return new Response(json, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': contentDisposition(project.name, 'json'),
        'cache-control': 'no-store',
      },
    })
  } catch {
    return providerJson({ error: 'EXPORT_FAILED' }, 503)
  }
}