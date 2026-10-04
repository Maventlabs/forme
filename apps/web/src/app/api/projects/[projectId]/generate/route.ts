import { parseProjectId } from '@/lib/project-input'
import { readJsonBody } from '@/lib/http-json'
import { scopedGenerationInputSchema } from '@/lib/provider-input'
import { getServerSession } from '@/lib/server-session'
import { getOwnedProjectCanvas } from '@/lib/canvas-persistence'
import { applyScopedAIEdit, isAIScopedEditTarget, parseAIEditOperations } from '@/lib/ai-edit'
import { fingerprintProviderRequest, providerRequestFingerprintMatches } from '@/lib/provider-secrets'
import { ProviderAdapterError } from '@/lib/provider-types'
import { getProviderAdapter } from '@/lib/provider-adapters'
import { completeGenerationJob, claimGenerationJob, finishGenerationJob, getOwnedGenerationJobForRequest } from '@/lib/generation-persistence'
import { getOwnedProviderConnection } from '@/lib/provider-service'
import { providerFailure, providerJson } from '@/lib/provider-http'
import { mutationFailureResponse } from '@/lib/http-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ projectId: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const invalidMutation = mutationFailureResponse(request)
  if (invalidMutation) return invalidMutation
  const session = await getServerSession()
  if (!session) return providerJson({ error: 'UNAUTHORIZED' }, 401)

  const { projectId: rawProjectId } = await params
  const parsedProjectId = parseProjectId(rawProjectId)
  if (!parsedProjectId.success) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)

  const body = await readJsonBody(request)
  if (!body.ok) return providerJson({ error: body.status === 413 ? 'BODY_TOO_LARGE' : 'INVALID_JSON' }, body.status)
  const parsedInput = scopedGenerationInputSchema.safeParse(body.value)
  if (!parsedInput.success) return providerJson({ error: 'INVALID_GENERATION_REQUEST' }, 422)
  const input = parsedInput.data
  const adapter = getProviderAdapter(input.provider)
  if (!adapter) return providerJson({ error: 'PROVIDER_NOT_AVAILABLE' }, 422)

  const requestFingerprintInput = JSON.stringify({
    projectId: parsedProjectId.data,
    nodeId: input.nodeId,
    expectedRevision: input.expectedRevision,
    provider: input.provider,
    modelId: input.modelId,
    instruction: input.instruction,
  })
  let requestHash: string
  try {
    requestHash = fingerprintProviderRequest(requestFingerprintInput)
  } catch {
    return providerJson({ error: 'PROVIDER_STORAGE_UNAVAILABLE' }, 503)
  }

  let previousJob
  try {
    previousJob = await getOwnedGenerationJobForRequest(session.user.id, input.idempotencyKey)
  } catch {
    return providerJson({ error: 'GENERATION_JOB_UNAVAILABLE' }, 503)
  }
  if (previousJob) {
    if (!providerRequestFingerprintMatches(requestFingerprintInput, previousJob.requestHash)) return providerJson({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, 422)
    if (previousJob.status === 'running') return providerJson({ job: { id: previousJob.id, status: 'running' } }, 202)
    if (previousJob.status !== 'succeeded') {
      return providerJson({ job: { id: previousJob.id, status: previousJob.status, error: previousJob.errorCode } }, 409)
    }
    try {
      const current = await getOwnedProjectCanvas(parsedProjectId.data, session.user.id)
      if (!current) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
      return providerJson({
        job: { id: previousJob.id, status: 'succeeded', replayed: true },
        project: { canvas: current.canvas, revision: current.revision },
        nodeId: input.nodeId,
      })
    } catch {
      return providerJson({ error: 'PROJECT_UNAVAILABLE' }, 503)
    }
  }

  let project
  try {
    project = await getOwnedProjectCanvas(parsedProjectId.data, session.user.id)
  } catch {
    return providerJson({ error: 'PROJECT_UNAVAILABLE' }, 503)
  }
  if (!project) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
  if (project.revision !== input.expectedRevision) {
    return providerJson({ error: 'REVISION_CONFLICT', revision: project.revision }, 409)
  }

  const node = project.canvas.nodes[input.nodeId]
  if (!node) return providerJson({ error: 'AI_TARGET_NODE_NOT_FOUND' }, 404)
  if (!isAIScopedEditTarget(node)) return providerJson({ error: 'AI_TARGET_NODE_NOT_EDITABLE' }, 422)

  let connection
  try {
    connection = await getOwnedProviderConnection(session.user.id, input.provider)
  } catch {
    return providerJson({ error: 'PROVIDER_CREDENTIAL_UNAVAILABLE' }, 503)
  }
  if (!connection) return providerJson({ error: 'PROVIDER_NOT_CONNECTED' }, 409)
  if (!connection.modelIds.includes(input.modelId)) return providerJson({ error: 'MODEL_NOT_AVAILABLE' }, 422)

  let claim
  try {
    claim = await claimGenerationJob({
      userId: session.user.id,
      projectId: parsedProjectId.data,
      nodeId: input.nodeId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      provider: input.provider,
      modelId: input.modelId,
    })
  } catch {
    return providerJson({ error: 'GENERATION_JOB_UNAVAILABLE' }, 503)
  }

  if (claim.state === 'rate-limited') return providerJson({ error: 'GENERATION_RATE_LIMITED' }, 429)
  if (claim.state === 'idempotency-conflict') return providerJson({ error: 'IDEMPOTENCY_KEY_CONFLICT' }, 422)
  if (claim.state === 'in-progress') return providerJson({ job: { id: claim.jobId, status: 'running' } }, 202)
  if (claim.state === 'replay') {
    if (claim.status !== 'succeeded') return providerJson({ job: { id: claim.jobId, status: claim.status, error: claim.errorCode } }, 409)
    try {
      const current = await getOwnedProjectCanvas(parsedProjectId.data, session.user.id)
      if (!current) return providerJson({ error: 'PROJECT_NOT_FOUND' }, 404)
      return providerJson({
        job: { id: claim.jobId, status: claim.status, replayed: true },
        project: { canvas: current.canvas, revision: current.revision },
        nodeId: input.nodeId,
      })
    } catch {
      return providerJson({ error: 'PROJECT_UNAVAILABLE' }, 503)
    }
  }

  try {
    const generatedText = await adapter.generateStructuredEdit({
      apiKey: connection.apiKey,
      configuration: connection.configuration,
      request: {
        modelId: input.modelId,
        node: { type: node.type, label: node.label, text: String(node.props.text ?? '') },
        instruction: input.instruction,
      },
    })
    const operations = parseAIEditOperations(generatedText)
    const canvas = applyScopedAIEdit(project.canvas, input.nodeId, operations)
    const revision = await completeGenerationJob({
      jobId: claim.jobId,
      userId: session.user.id,
      projectId: project.id,
      expectedRevision: input.expectedRevision,
      canvas,
    })
    if (revision === null) return providerJson({ error: 'REVISION_CONFLICT' }, 409)
    return providerJson({
      job: { id: claim.jobId, status: 'succeeded' },
      project: { canvas, revision },
      nodeId: input.nodeId,
    })
  } catch (error) {
    const code = error instanceof ProviderAdapterError
      ? error.code
      : error instanceof Error && error.message.startsWith('AI_OUTPUT_')
        ? error.message
        : error instanceof Error && error.message.startsWith('AI_TARGET_')
          ? error.message
          : 'GENERATION_FAILED'
    const outcomeUnknown = error instanceof ProviderAdapterError && error.outcomeUnknown
    await finishGenerationJob({
      jobId: claim.jobId,
      userId: session.user.id,
      status: outcomeUnknown ? 'unknown' : 'failed',
      errorCode: code,
    }).catch(() => undefined)
    if (error instanceof ProviderAdapterError) return providerFailure(error)
    return providerJson({ error: code }, code === 'AI_TARGET_NODE_NOT_FOUND' ? 404 : 502)
  }
}
