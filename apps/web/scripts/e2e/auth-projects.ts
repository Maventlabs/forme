import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { config as loadEnv } from 'dotenv'
import { Pool, type PoolClient } from 'pg'
import type { CanvasDocument, CustomBlockDefinition } from '@forme/design-ir'
import { decryptProviderSecret } from '../../src/lib/provider-secrets'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const timeoutMs = Number(process.env.E2E_TIMEOUT_MS ?? 10_000)
const runId = randomUUID()
const emails = [
  `forme-e2e+${runId}.owner@example.com`,
  `forme-e2e+${runId}.other@example.com`,
]
const password = randomBytes(32).toString('base64url')
const userIds = new Set<string>()
const projectIds = new Set<string>()

class CookieJar {
  private readonly cookies = new Map<string, string>()

  absorb(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';', 1)
      const separator = pair.indexOf('=')
      if (separator < 1) continue

      const name = pair.slice(0, separator)
      const value = pair.slice(separator + 1)
      if (/max-age=0/i.test(cookie) || /expires=thu, 01 jan 1970/i.test(cookie)) {
        this.cookies.delete(name)
      } else {
        this.cookies.set(name, value)
      }
    }
  }

  get header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  }
}

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

function resolveBaseUrl() {
  const url = new URL(requiredEnvironment('E2E_BASE_URL'))
  const localHost = new Set(['localhost', '127.0.0.1', '[::1]'])
  const local = localHost.has(url.hostname)
  if (!local && process.env.E2E_ALLOW_REMOTE !== 'true') {
    throw new Error('Remote E2E requires E2E_ALLOW_REMOTE=true')
  }
  if (!local && url.protocol !== 'https:') {
    throw new Error('Remote E2E targets must use HTTPS')
  }
  if (!local && !['staging', 'production'].includes(process.env.E2E_TARGET ?? '')) {
    throw new Error('Remote E2E requires E2E_TARGET=staging or production')
  }
  if (process.env.E2E_TARGET === 'production' && process.env.E2E_CONFIRM_PRODUCTION_WRITE !== 'yes') {
    throw new Error('Production E2E writes require E2E_CONFIRM_PRODUCTION_WRITE=yes')
  }
  if (!local && !process.env.E2E_DATABASE_URL) {
    throw new Error('Remote E2E requires its matching E2E_DATABASE_URL for verification and cleanup')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('E2E_BASE_URL must not contain credentials, a query, or a fragment')
  }
  url.pathname = url.pathname.replace(/\/$/, '')
  return url
}

async function request(
  baseUrl: URL,
  path: string,
  options: { method?: string; json?: unknown; jar?: CookieJar; timeoutMs?: number } = {},
) {
  const headers = new Headers({ origin: baseUrl.origin })
  if (options.json !== undefined) headers.set('content-type', 'application/json')
  if (options.jar?.header) headers.set('cookie', options.jar.header)

  const response = await fetch(new URL(path, baseUrl), {
    method: options.method ?? 'GET',
    headers,
    body: options.json === undefined ? undefined : JSON.stringify(options.json),
    redirect: 'manual',
    signal: AbortSignal.timeout(options.timeoutMs ?? timeoutMs),
  })
  options.jar?.absorb(response)
  return response
}

async function createAccount(baseUrl: URL, email: string, name: string, jar: CookieJar) {
  const response = await request(baseUrl, '/api/auth/sign-up/email', {
    method: 'POST',
    json: { name, email, password },
    jar,
  })
  assert.equal(response.ok, true, `email signup must succeed (HTTP ${response.status})`)

  const result = await response.json() as { user?: { id?: unknown; email?: unknown } }
  const userId = result.user?.id
  assert.equal(result.user?.email, email, 'signup must return the newly created account')
  assert.equal(typeof userId, 'string', 'signup must return a user id')
  userIds.add(userId as string)
  assert.ok(jar.header.length > 0, 'signup must persist a session cookie')
  return userId as string
}

async function signIn(baseUrl: URL, email: string, pass: string, jar: CookieJar) {
  return request(baseUrl, '/api/auth/sign-in/email', {
    method: 'POST',
    json: { email, password: pass },
    jar,
  })
}

function pass(label: string) {
  process.stdout.write(`PASS | ${label}\n`)
}

async function runGeminiJourney(baseUrl: URL, pool: Pool, ownerId: string, ownerJar: CookieJar, otherJar: CookieJar) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    if (process.env.E2E_REQUIRE_GEMINI === 'true') throw new Error('GEMINI_API_KEY is required for the Gemini E2E journey')
    process.stdout.write('SKIP | Gemini provider E2E (GEMINI_API_KEY is not configured)\n')
    return
  }

  const invalidKey = 'FORME_E2E_INVALID_GEMINI_KEY_DO_NOT_USE'
  const invalidConnect = await request(baseUrl, '/api/providers/connect', {
    method: 'POST',
    json: { provider: 'google-gemini', apiKey: invalidKey },
    jar: ownerJar,
    timeoutMs: 20_000,
  })
  assert.equal(invalidConnect.status, 422, 'invalid Gemini key must be rejected by the real provider')
  assert.ok(!JSON.stringify(await invalidConnect.json()).includes(invalidKey), 'invalid credential must not be reflected in the API response')
  const invalidCredentialRow = await pool.query<{ encrypted_secret: string | null }>(
    'SELECT encrypted_secret FROM provider_connections WHERE user_id = $1 AND provider = $2',
    [ownerId, 'google-gemini'],
  )
  assert.equal(invalidCredentialRow.rows[0]?.encrypted_secret ?? null, null, 'invalid key must not be stored')
  pass('Gemini invalid credential rejected without persistence or response disclosure')

  const connect = await request(baseUrl, '/api/providers/connect', {
    method: 'POST',
    json: { provider: 'google-gemini', apiKey },
    jar: ownerJar,
    timeoutMs: 45_000,
  })
  assert.equal(connect.status, 201, `valid Gemini connection must succeed (HTTP ${connect.status})`)
  const connected = await connect.json() as {
    connection?: { id?: unknown; provider?: unknown; models?: Array<{ id?: unknown; displayName?: unknown; capabilities?: unknown[] }> }
  }
  assert.equal(connected.connection?.provider, 'google-gemini', 'connection must identify the selected provider')
  assert.equal(typeof connected.connection?.id, 'string', 'connection must persist with a server-generated id')
  assert.ok((connected.connection?.models?.length ?? 0) > 0, 'connection must return models discovered live')
  assert.ok(!JSON.stringify(connected).includes(apiKey), 'provider credential must never be returned to the client')
  const generationModels = connected.connection!.models!.filter((model) => Array.isArray(model.capabilities) && model.capabilities.includes('text-generation'))
  const currentModels = generationModels.filter((model) => typeof model.id === 'string' && model.id.toLowerCase().endsWith('-latest'))
  const selectedModel = currentModels.find((model) => /lite/i.test(String(model.displayName))) ?? currentModels[0] ?? generationModels[0]
  assert.equal(typeof selectedModel?.id, 'string', 'a live generation-capable model must be selectable')
  const encryptedRow = await pool.query<{ id: string; encrypted_secret: string | null }>(
    'SELECT id, encrypted_secret FROM provider_connections WHERE user_id = $1 AND provider = $2',
    [ownerId, 'google-gemini'],
  )
  const encryptedSecret = encryptedRow.rows[0]?.encrypted_secret
  assert.ok(typeof encryptedSecret === 'string' && encryptedSecret.length > 0, 'connection must persist encrypted credential material')
  assert.ok(!encryptedSecret.includes(apiKey), 'database must not store the plaintext provider key')
  // The envelope carries a versioned credential payload so provider config
  // (Base URL / manual Model ID) can be encrypted together with the secret.
  const decryptedPayload = JSON.parse(decryptProviderSecret(encryptedSecret, { ownerId, provider: 'google-gemini' })) as { v?: number; apiKey?: string }
  assert.equal(decryptedPayload.apiKey, apiKey, 'server keyring must decrypt the saved credential for provider calls')
  const initialCache = await pool.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM model_cache WHERE connection_id = $1::uuid',
    [connected.connection!.id],
  )
  assert.equal(initialCache.rows[0]?.count, connected.connection!.models!.length, 'provider discovery must persist the live model cache')
  pass(`Gemini credential encrypted at rest; ${connected.connection!.models!.length} live models listed`)

  const providerList = await request(baseUrl, '/api/providers', { jar: ownerJar })
  assert.equal(providerList.ok, true, 'owner must read their provider connection and model cache')
  const ownerProviders = await providerList.json() as { connections?: Array<{ provider?: unknown; models?: Array<{ id?: unknown }> }> }
  const ownerGemini = ownerProviders.connections?.find((connection) => connection.provider === 'google-gemini')
  assert.ok(ownerGemini?.models?.some((model) => model.id === selectedModel?.id), 'persisted model cache must include the live selected model')
  assert.ok(!JSON.stringify(ownerProviders).includes(apiKey), 'provider list must not expose plaintext credentials')

  const syncModels = await request(baseUrl, '/api/providers/google-gemini/sync-models', {
    method: 'POST',
    jar: ownerJar,
    timeoutMs: 45_000,
  })
  assert.equal(syncModels.ok, true, 'owner must refresh models from the real provider')
  const synced = await syncModels.json() as { models?: Array<{ id?: unknown; capabilities?: unknown[] }> }
  assert.ok(synced.models?.some((model) => model.id === selectedModel?.id && model.capabilities?.includes('text-generation')), 'live refresh must preserve the selected model capability')
  const syncedCache = await pool.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM model_cache WHERE connection_id = $1::uuid',
    [connected.connection!.id],
  )
  assert.equal(syncedCache.rows[0]?.count, synced.models?.length, 'model refresh must replace the persistent cache with live rows')

  const otherProviders = await request(baseUrl, '/api/providers', { jar: otherJar })
  assert.equal(otherProviders.ok, true, 'other authenticated users can list their own provider connections')
  const otherProviderList = await otherProviders.json() as { connections?: unknown[] }
  assert.equal(otherProviderList.connections?.length, 0, 'provider credentials and model cache must be owner-scoped')
  const otherModelSync = await request(baseUrl, '/api/providers/google-gemini/sync-models', { method: 'POST', jar: otherJar })
  assert.equal(otherModelSync.status, 404, 'other users must not sync an owner provider connection')

  const created = await request(baseUrl, '/api/projects', {
    method: 'POST',
    json: { name: `FORME E2E Gemini ${runId}` },
    jar: ownerJar,
  })
  assert.equal(created.status, 201, 'AI edit project must be created through the owner API')
  const createdProject = await created.json() as { project?: { id?: unknown } }
  const projectId = createdProject.project?.id
  assert.equal(typeof projectId, 'string', 'AI edit project must have an id')
  projectIds.add(projectId as string)

  const targetNodeId = randomUUID()
  const targetCreate = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: { projectId, expectedRevision: 0, id: targetNodeId, blockId: 'heading', label: 'Main heading', props: { text: 'Old wireframe title' } },
    jar: ownerJar,
  })
  assert.equal(targetCreate.status, 201, 'AI target heading must be created through the canonical node API')
  const sentinelNodeId = randomUUID()
  const sentinelCreate = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: { projectId, expectedRevision: 1, id: sentinelNodeId, blockId: 'paragraph', label: 'Unrelated note', props: { text: 'Do not change this note' } },
    jar: ownerJar,
  })
  assert.equal(sentinelCreate.status, 201, 'unrelated sentinel node must be persisted before the AI edit')

  const instruction = 'Rewrite this heading as a concise title for a wireframing workspace. Return only the replacement title.'
  const generationInput = {
    nodeId: targetNodeId,
    expectedRevision: 2,
    idempotencyKey: randomUUID(),
    provider: 'google-gemini',
    modelId: selectedModel!.id as string,
    instruction,
  }
  const invalidModel = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: { ...generationInput, modelId: 'not-live-or-cached' },
    jar: ownerJar,
    timeoutMs: 45_000,
  })
  assert.equal(invalidModel.status, 422, 'model selector must reject model ids absent from live discovery')

  const generated = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: generationInput,
    jar: ownerJar,
    timeoutMs: 60_000,
  })
  const generatedResult = await generated.json() as {
    error?: unknown
    providerStatus?: unknown
    job?: { id?: unknown; status?: unknown }
    nodeId?: unknown
    project?: { canvas?: CanvasDocument; revision?: number }
  }
  assert.equal(generated.status, 200, `real scoped Gemini edit must persist (HTTP ${generated.status}; code ${typeof generatedResult.error === 'string' ? generatedResult.error : 'unknown'}; provider HTTP ${typeof generatedResult.providerStatus === 'number' ? generatedResult.providerStatus : 'unknown'}; live model ${selectedModel!.id})`)
  assert.ok(!JSON.stringify(generatedResult).includes(apiKey), 'AI generation response must never expose the provider key')
  const generatedTitle = generatedResult.project?.canvas?.nodes?.[targetNodeId]?.props.text
  assert.equal(generatedResult.job?.status, 'succeeded', 'generation job must complete successfully')
  assert.equal(generatedResult.nodeId, targetNodeId, 'AI result must remain scoped to the requested node')
  assert.equal(generatedResult.project?.revision, 3, 'scoped AI edit must advance the canonical revision once')
  assert.ok(typeof generatedTitle === 'string' && generatedTitle.length > 0 && generatedTitle !== 'Old wireframe title', 'selected heading must receive actual model output')
  assert.equal(generatedResult.project?.canvas?.nodes?.[sentinelNodeId]?.props.text, 'Do not change this note', 'unselected node content must not change')
  assert.deepEqual(generatedResult.project?.canvas?.rootIds, [targetNodeId, sentinelNodeId], 'AI edit must not add, remove, or reorder nodes')

  const retryGeneration = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: generationInput,
    jar: ownerJar,
    timeoutMs: 20_000,
  })
  assert.equal(retryGeneration.status, 200, 'replaying a completed generation intent must recover without another model call')
  const retryResult = await retryGeneration.json() as { job?: { replayed?: unknown }; project?: { revision?: unknown } }
  assert.equal(retryResult.job?.replayed, true, 'same generation key must replay the recorded result')
  assert.equal(retryResult.project?.revision, 3, 'generation replay must not advance the canvas revision twice')

  const generationStatus = await request(baseUrl, `/api/generation/${generationInput.idempotencyKey}`, { jar: ownerJar })
  assert.equal(generationStatus.ok, true, 'owner can recover the generation job status')
  const statusResult = await generationStatus.json() as { job?: { status?: unknown; resultRevision?: unknown } }
  assert.equal(statusResult.job?.status, 'succeeded', 'generation status endpoint must show the durable terminal state')
  assert.equal(statusResult.job?.resultRevision, 3, 'generation job must reference the persisted canvas revision')

  const aiReadBack = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  const aiProject = await aiReadBack.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
  assert.equal(aiProject.project?.canvas?.nodes?.[targetNodeId]?.props.text, generatedTitle, 'AI-generated content must survive a fresh Neon read-back')
  assert.equal(aiProject.project?.canvas?.nodes?.[sentinelNodeId]?.props.text, 'Do not change this note', 'fresh read-back must preserve the unrelated node')
  assert.equal(aiProject.project?.revision, 3, 'fresh read-back must retain the generation revision')
  const generationRow = await pool.query<{ status: string; request_hash: string; result_revision: number }>(
    'SELECT status, request_hash, result_revision FROM ai_generation_jobs WHERE id = $1::uuid AND user_id = $2',
    [generatedResult.job!.id, ownerId],
  )
  assert.equal(generationRow.rows[0]?.status, 'succeeded', 'generation job state must persist in Neon')
  assert.equal(generationRow.rows[0]?.result_revision, 3, 'generation job must persist the committed canvas revision')
  assert.ok(!generationRow.rows[0]?.request_hash.includes(instruction), 'generation job must not persist the raw prompt')
  const aiWorkspace = await request(baseUrl, `/workspace/${projectId}`, { jar: ownerJar })
  assert.ok((await aiWorkspace.text()).includes(String(generatedTitle)), 'workspace reload must render the generated title')

  const otherGenerationStatus = await request(baseUrl, `/api/generation/${generationInput.idempotencyKey}`, { jar: otherJar })
  assert.equal(otherGenerationStatus.status, 404, 'other users must not inspect a private generation job')
  const deniedGeneration = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: { ...generationInput, idempotencyKey: randomUUID() },
    jar: otherJar,
  })
  assert.equal(deniedGeneration.status, 404, 'other users must not generate against a private project')
  pass('real Gemini model discovery, encrypted connection, scoped edit, idempotent recovery, Neon read-back, and owner isolation')

  // ---- scoped appendChild under a selected container ----
  const containerNodeId = randomUUID()
  const containerCreate = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: { projectId, expectedRevision: 3, id: containerNodeId, blockId: 'container', label: 'Feature group' },
    jar: ownerJar,
  })
  assert.equal(containerCreate.status, 201, 'container node must be created before scoped appendChild')

  const foreignScope = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: {
      nodeId: randomUUID(),
      expectedRevision: 4,
      idempotencyKey: randomUUID(),
      provider: 'google-gemini',
      modelId: selectedModel!.id,
      instruction: 'Add a heading inside this node.',
    },
    jar: ownerJar,
    timeoutMs: 45_000,
  })
  assert.equal(foreignScope.status, 404, 'generation must reject a node id outside the authorized project scope')

  const staleRevision = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: {
      nodeId: containerNodeId,
      expectedRevision: 1,
      idempotencyKey: randomUUID(),
      provider: 'google-gemini',
      modelId: selectedModel!.id,
      instruction: 'Add a heading inside this container.',
    },
    jar: ownerJar,
    timeoutMs: 45_000,
  })
  assert.equal(staleRevision.status, 409, 'appendChild must fail on a stale canvas revision without mutating state')

  const appendInput = {
    nodeId: containerNodeId,
    expectedRevision: 4,
    idempotencyKey: randomUUID(),
    provider: 'google-gemini',
    modelId: selectedModel!.id,
    instruction: 'Add one heading child inside this container. Keep it short and return only the structured operation.',
  }
  const appended = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: appendInput,
    jar: ownerJar,
    timeoutMs: 60_000,
  })
  const appendedResult = await appended.json() as {
    error?: unknown
    job?: { status?: unknown }
    project?: { canvas?: CanvasDocument; revision?: number }
  }
  assert.equal(
    appended.status,
    200,
    `scoped appendChild must persist (HTTP ${appended.status}; code ${typeof appendedResult.error === 'string' ? appendedResult.error : 'unknown'}; live model ${selectedModel!.id})`,
  )
  assert.equal(appendedResult.job?.status, 'succeeded', 'appendChild generation job must succeed')
  assert.equal(appendedResult.project?.revision, 5, 'appendChild must advance the canonical revision exactly once')

  const containerAfter = appendedResult.project?.canvas?.nodes?.[containerNodeId]
  assert.equal(containerAfter?.children.length, 1, 'appendChild must add exactly one child to the selected container')
  const appendedChildId = containerAfter!.children[0]!
  const appendedChild = appendedResult.project?.canvas?.nodes?.[appendedChildId]
  assert.ok(appendedChild, 'appended child must be persisted in the canonical canvas')
  assert.equal(appendedChild.parentId, containerNodeId, 'appended child must be parented to the server-selected container')
  assert.equal(appendedResult.project?.canvas?.nodes?.[sentinelNodeId]?.props.text, 'Do not change this note', 'appendChild must not change unrelated nodes')
  assert.deepEqual(appendedResult.project?.canvas?.rootIds, [targetNodeId, sentinelNodeId, containerNodeId], 'appendChild must not add or reorder root nodes')

  const replayAppend = await request(baseUrl, `/api/projects/${projectId}/generate`, {
    method: 'POST',
    json: appendInput,
    jar: ownerJar,
    timeoutMs: 20_000,
  })
  const replayAppendResult = await replayAppend.json() as { job?: { replayed?: unknown }; project?: { revision?: unknown } }
  assert.equal(replayAppend.status, 200, 'replaying the appendChild intent must recover without a second model call')
  assert.equal(replayAppendResult.job?.replayed, true, 'appendChild replay must be served from the recorded job')
  assert.equal(replayAppendResult.project?.revision, 5, 'appendChild replay must not add a second child or advance the revision')

  const appendReadBack = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  const appendProject = await appendReadBack.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
  assert.equal(appendProject.project?.revision, 5, 'appendChild must survive a fresh Neon read-back')
  assert.equal(appendProject.project?.canvas?.nodes?.[containerNodeId]?.children.length, 1, 'fresh read-back must contain exactly one appended child')
  assert.ok(
    appendedChildId !== undefined && appendProject.project?.canvas?.nodes?.[appendedChildId],
    'fresh read-back must resolve the appended child node',
  )
  pass('scoped appendChild persists one server-named child, rejects stale revision and foreign scope, and replays idempotently')

  // ---- provider timeout: failure state, no partial mutation, safe retry ----
  const timeoutProject = await request(baseUrl, '/api/projects', {
    method: 'POST',
    json: { name: `FORME E2E timeout ${runId}` },
    jar: ownerJar,
  })
  const timeoutProjectId = (await timeoutProject.json() as { project?: { id?: string } }).project?.id
  assert.equal(typeof timeoutProjectId, 'string', 'timeout journey must have its own project')
  projectIds.add(timeoutProjectId as string)
  const timeoutNodeId = randomUUID()
  const timeoutNodeCreate = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: { projectId: timeoutProjectId, expectedRevision: 0, id: timeoutNodeId, blockId: 'heading', label: 'Timeout target', props: { text: 'Unchanged by failure' } },
    jar: ownerJar,
  })
  assert.equal(timeoutNodeCreate.status, 201, 'timeout journey must seed a target node')

  const timeoutInput = {
    nodeId: timeoutNodeId,
    expectedRevision: 1,
    idempotencyKey: randomUUID(),
    provider: 'google-gemini',
    modelId: selectedModel!.id,
    instruction: 'Rewrite this heading. FORME_E2E_INJECT_TIMEOUT_ALWAYS',
  }
  const timedOut = await request(baseUrl, `/api/projects/${timeoutProjectId}/generate`, {
    method: 'POST',
    json: timeoutInput,
    jar: ownerJar,
    timeoutMs: 60_000,
  })
  const timedOutResult = await timedOut.json() as { error?: unknown; job?: { status?: unknown } }
  assert.equal(timedOutResult.error, 'PROVIDER_TIMEOUT', 'a persistent provider timeout must surface a real timeout error')
  assert.equal(timedOut.status, 504, 'timeout must map to HTTP 504')

  const timeoutJob = await request(baseUrl, `/api/generation/${timeoutInput.idempotencyKey}`, { jar: ownerJar })
  const timeoutJobResult = await timeoutJob.json() as { job?: { status?: unknown; errorCode?: unknown } }
  assert.ok(
    timeoutJobResult.job?.status === 'unknown' || timeoutJobResult.job?.status === 'failed',
    `timeout job must reach a terminal recoverable state (got ${String(timeoutJobResult.job?.status)})`,
  )

  const afterTimeout = await request(baseUrl, `/api/projects/${timeoutProjectId}`, { jar: ownerJar })
  const afterTimeoutProject = await afterTimeout.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
  assert.equal(afterTimeoutProject.project?.revision, 1, 'a failed generation must not advance the canvas revision')
  assert.equal(afterTimeoutProject.project?.canvas?.nodes?.[timeoutNodeId]?.props.text, 'Unchanged by failure', 'a failed generation must not partially mutate the canvas')
  const timeoutJobRows = await pool.query<{ status: string }>(
    'SELECT status FROM ai_generation_jobs WHERE user_id = $1 AND project_id = $2::uuid',
    [ownerId, timeoutProjectId],
  )
  assert.equal(timeoutJobRows.rowCount, 1, 'exactly one job row must exist for the failed generation')
  assert.notEqual(timeoutJobRows.rows[0]?.status, 'succeeded', 'a timed-out generation must never be recorded as succeeded')

  const retried = await request(baseUrl, `/api/projects/${timeoutProjectId}/generate`, {
    method: 'POST',
    json: { ...timeoutInput, instruction: 'Rewrite this heading. FORME_E2E_INJECT_TIMEOUT_ONCE', idempotencyKey: randomUUID() },
    jar: ownerJar,
    timeoutMs: 60_000,
  })
  const retriedResult = await retried.json() as {
    error?: unknown
    job?: { status?: unknown }
    project?: { canvas?: CanvasDocument; revision?: number }
  }
  assert.equal(
    retried.status,
    200,
    `retry after a transient timeout must recover through the real provider (HTTP ${retried.status}; code ${typeof retriedResult.error === 'string' ? retriedResult.error : 'unknown'})`,
  )
  assert.equal(retriedResult.job?.status, 'succeeded', 'the retried generation must succeed')
  assert.equal(retriedResult.project?.revision, 2, 'a successful retry advances the revision exactly once')
  assert.ok(
    retriedResult.project?.canvas?.nodes?.[timeoutNodeId]?.props.text !== 'Unchanged by failure',
    'the successful retry must actually apply the scoped edit',
  )
  pass('provider timeout fails safely without mutation, records a recoverable job, and a bounded retry recovers through the real provider')

  const disconnect = await request(baseUrl, '/api/providers/google-gemini', { method: 'DELETE', jar: ownerJar })
  assert.equal(disconnect.status, 204, 'owner must be able to remove the provider connection')
  const providersAfterDisconnect = await request(baseUrl, '/api/providers', { jar: ownerJar })
  const disconnected = await providersAfterDisconnect.json() as { connections?: unknown[] }
  assert.equal(disconnected.connections?.length, 0, 'disconnect must remove the model selector entry')
  const remainingConnection = await pool.query<{ encrypted_secret: string | null }>(
    'SELECT encrypted_secret FROM provider_connections WHERE user_id = $1 AND provider = $2',
    [ownerId, 'google-gemini'],
  )
  assert.equal(remainingConnection.rows[0]?.encrypted_secret ?? null, null, 'disconnect must erase encrypted provider credential data')
  const remainingCache = await pool.query('SELECT id FROM model_cache WHERE connection_id = $1::uuid', [connected.connection!.id])
  assert.equal(remainingCache.rowCount, 0, 'disconnect must cascade-delete the model cache')
  pass('Gemini disconnect and encrypted model-cache cleanup')
}

async function run(baseUrl: URL, pool: Pool) {
  const anonymousProjects = await request(baseUrl, '/api/projects')
  assert.equal(anonymousProjects.status, 401, 'anonymous users must not list private projects')

  const ownerSignupJar = new CookieJar()
  const ownerId = await createAccount(baseUrl, emails[0], 'FORME E2E Owner', ownerSignupJar)
  const signupSession = await request(baseUrl, '/api/auth/get-session', { jar: ownerSignupJar })
  assert.equal(signupSession.ok, true, 'signup session must survive a separate HTTP request')
  pass('email signup and server-backed session')

  const failedLogin = await signIn(baseUrl, emails[0], `${password}-wrong`, new CookieJar())
  assert.equal(failedLogin.ok, false, 'incorrect credentials must not create a session')
  const ownerJar = new CookieJar()
  const validLogin = await signIn(baseUrl, emails[0], password, ownerJar)
  assert.equal(validLogin.ok, true, 'correct credentials must recover after a rejected login')
  assert.ok(ownerJar.header.length > 0, 'successful login must return a session cookie')
  pass('invalid credentials rejected and valid login recovers')

  const invalidProject = await request(baseUrl, '/api/projects', {
    method: 'POST',
    json: { name: '   ' },
    jar: ownerJar,
  })
  assert.equal(invalidProject.status, 422, 'invalid project data must be rejected')

  const created = await request(baseUrl, '/api/projects', {
    method: 'POST',
    json: { name: `FORME E2E ${runId}` },
    jar: ownerJar,
  })
  assert.equal(created.status, 201, `owner project creation must succeed (HTTP ${created.status})`)
  const createdResult = await created.json() as { project?: { id?: unknown; name?: unknown } }
  const projectId = createdResult.project?.id
  assert.equal(typeof projectId, 'string', 'project creation must return a project id')
  assert.equal(createdResult.project?.name, `FORME E2E ${runId}`, 'created project name must be retained')
  projectIds.add(projectId as string)

  const ownerList = await request(baseUrl, '/api/projects', { jar: ownerJar })
  assert.equal(ownerList.ok, true, 'owner must be able to reload the project list')
  const ownerListResult = await ownerList.json() as { projects?: Array<{ id?: unknown; nodeCount?: unknown; preview?: unknown[] }> }
  const listedProject = ownerListResult.projects?.find((project) => project.id === projectId)
  assert.ok(listedProject, 'project must persist across requests')
  assert.equal(listedProject.nodeCount, 0, 'a new project preview must reflect its empty persisted canvas')
  assert.deepEqual(listedProject.preview, [], 'an empty canvas must not receive invented preview nodes')

  const hubResponse = await request(baseUrl, '/projects', { jar: ownerJar })
  assert.equal(hubResponse.status, 200, 'authenticated signup/login destination must render the product hub')
  const hubHtml = await hubResponse.text()
  for (const destination of ['Workspace', 'Generator', 'Cloning']) {
    assert.match(hubHtml, new RegExp(destination), `product navigation must include ${destination}`)
  }
  assert.match(hubHtml, /FORME E2E /, 'workspace hub must render the owner project card')
  pass('post-login Workspace hub renders owner projects and all three destinations')

  for (const [path, featureName, purpose] of [
    ['/generator', 'Generator', 'Automatic DESIGN.md generation is not available yet.'],
    ['/cloning', 'Cloning', 'Website-to-wireframe import is not available yet.'],
  ] as const) {
    const featurePage = await request(baseUrl, path, { jar: ownerJar })
    assert.equal(featurePage.status, 200, `${featureName} must have an authenticated destination`)
    const featureHtml = await featurePage.text()
    assert.ok(featureHtml.includes(purpose), `${featureName} page must explain its current availability`)
    assert.match(featureHtml, /Coming soon/, `${featureName} must disclose its inactive state`)
    assert.doesNotMatch(featureHtml, /<form\b/i, `${featureName} must not show a fake active workflow`)
  }
  pass('Generator and Cloning remain explicit non-working Coming Soon routes')

  const parentId = randomUUID()
  const createParentInput = {
    id: parentId,
    projectId,
    expectedRevision: 0,
    blockId: 'container',
    label: 'Main section',
  }
  const createParent = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: createParentInput,
    jar: ownerJar,
  })
  assert.equal(createParent.status, 201, `owner block placement must succeed (HTTP ${createParent.status})`)
  const parentResult = await createParent.json() as { node?: { id?: unknown }; revision?: unknown }
  assert.equal(parentResult.node?.id, parentId, 'block placement must retain the supplied semantic id')
  assert.equal(parentResult.revision, 1, 'first node write must advance the canvas revision')

  const retriedParent = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: createParentInput,
    jar: ownerJar,
  })
  assert.equal(retriedParent.status, 200, 'replaying a successful block placement must be idempotent')
  const retriedParentResult = await retriedParent.json() as { node?: { id?: unknown }; revision?: unknown }
  assert.equal(retriedParentResult.node?.id, parentId, 'create retry must retain the original identity')
  assert.equal(retriedParentResult.revision, 1, 'create retry must not advance revision twice')

  const nodeId = randomUUID()
  const createNodeInput = {
    id: nodeId,
    projectId,
    expectedRevision: 1,
    blockId: 'heading',
    parentId,
    label: 'Primary heading',
    props: { text: 'Wireframe that persists' },
  }
  const createNode = await request(baseUrl, '/api/nodes', { method: 'POST', json: createNodeInput, jar: ownerJar })
  assert.equal(createNode.status, 201, `nested node creation must succeed (HTTP ${createNode.status})`)
  const nodeResult = await createNode.json() as { node?: { id?: unknown; parentId?: unknown }; revision?: unknown }
  assert.equal(nodeResult.node?.id, nodeId, 'node creation must retain the supplied stable semantic id')
  assert.equal(nodeResult.node?.parentId, parentId, 'child must retain its parent identity')
  assert.equal(nodeResult.revision, 2, 'child write must advance the canvas revision')

  const retriedCreate = await request(baseUrl, '/api/nodes', { method: 'POST', json: createNodeInput, jar: ownerJar })
  assert.equal(retriedCreate.status, 200, 'replaying a successful child create must be idempotent')
  const retriedCreateResult = await retriedCreate.json() as { node?: { id?: unknown }; revision?: unknown }
  assert.equal(retriedCreateResult.node?.id, nodeId, 'child retry must retain the original identity')
  assert.equal(retriedCreateResult.revision, 2, 'child retry must not advance revision twice')

  const staleNodeUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: { projectId, expectedRevision: 1, changes: { label: 'Stale title' } },
    jar: ownerJar,
  })
  assert.equal(staleNodeUpdate.status, 409, 'stale canvas revisions must be rejected')

  const invalidNodeUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: { projectId, expectedRevision: 2, changes: { label: '   ' } },
    jar: ownerJar,
  })
  assert.equal(invalidNodeUpdate.status, 422, 'invalid semantic labels must be rejected')

  const malformedCanvas = await request(baseUrl, `/api/projects/${projectId}/canvas`, {
    method: 'PUT',
    json: {
      expectedRevision: 2,
      canvas: {
        schemaVersion: 1,
        nodes: {},
        rootIds: [randomUUID()],
        breakpoints: {
          desktop: { width: 1440, height: 'auto' },
          tablet: { width: 768, height: 'auto' },
          mobile: { width: 390, height: 'auto' },
        },
        designContextRef: null,
      },
    },
    jar: ownerJar,
  })
  assert.equal(malformedCanvas.status, 422, 'malformed design documents must not persist')

  const updateNode = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: {
      projectId,
      expectedRevision: 2,
      changes: {
        label: 'Page title',
        props: { text: 'Wireframe that persists' },
        layouts: {
          desktop: { mode: 'absolute', x: 64, y: 48, width: 480, height: 'auto', order: 0, gap: 8, padding: 16, alignment: 'start', justify: 'start' },
        },
      },
    },
    jar: ownerJar,
  })
  assert.equal(updateNode.status, 200, `owner node update must succeed (HTTP ${updateNode.status})`)
  const updatedNodeResult = await updateNode.json() as { node?: { id?: unknown; label?: unknown }; revision?: unknown }
  assert.equal(updatedNodeResult.node?.id, nodeId, 'node updates must preserve semantic identity')
  assert.equal(updatedNodeResult.node?.label, 'Page title', 'semantic label edits must be applied')
  assert.equal(updatedNodeResult.revision, 3, 'node update must advance the canvas revision')

  const retriedUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: {
      projectId,
      expectedRevision: 2,
      changes: {
        label: 'Page title',
        props: { text: 'Wireframe that persists' },
        layouts: {
          desktop: { mode: 'absolute', x: 64, y: 48, width: 480, height: 'auto', order: 0, gap: 8, padding: 16, alignment: 'start', justify: 'start' },
        },
      },
    },
    jar: ownerJar,
  })
  assert.equal(retriedUpdate.status, 200, 'replaying the same node update must be idempotent')
  const retriedUpdateResult = await retriedUpdate.json() as { revision?: unknown }
  assert.equal(retriedUpdateResult.revision, 3, 'update retry must not advance revision twice')

  const canvasReadBack = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  assert.equal(canvasReadBack.ok, true, 'owner must reload the persisted design document')
  const canvasProject = await canvasReadBack.json() as {
    project?: { canvas?: CanvasDocument; revision?: number }
  }
  assert.equal(canvasProject.project?.canvas?.nodes?.[nodeId as string]?.label, 'Page title', 'reloaded canvas must retain the edited semantic node')
  assert.equal(canvasProject.project?.canvas?.nodes?.[nodeId as string]?.props?.text, 'Wireframe that persists', 'reloaded canvas must retain node content')
  assert.equal(canvasProject.project?.canvas?.nodes?.[nodeId as string]?.layouts.desktop.x, 64, 'move position must persist')
  assert.equal(canvasProject.project?.canvas?.nodes?.[nodeId as string]?.layouts.desktop.width, 480, 'resize dimensions must persist')
  assert.equal(canvasProject.project?.revision, 3, 'reloaded canvas must retain its revision')
  assert.deepEqual(canvasProject.project?.canvas?.nodes?.[parentId]?.children, [nodeId], 'reloaded parent must retain its child identity')

  const currentNode = canvasProject.project!.canvas!.nodes[nodeId]!
  const tabletLayout = currentNode.layouts.tablet ?? currentNode.layouts.desktop
  const responsiveLayouts = {
    ...currentNode.layouts,
    tablet: { ...tabletLayout, mode: 'flow' as const, x: 0, y: 0, width: 720, order: 0 },
  }
  const tabletUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: { projectId, expectedRevision: 3, changes: { layouts: responsiveLayouts } },
    jar: ownerJar,
  })
  assert.equal(tabletUpdate.status, 200, 'tablet override must persist without changing node identity')
  const tabletUpdateResult = await tabletUpdate.json() as { node?: { id?: unknown; layouts?: { tablet?: { width?: unknown } } }; revision?: unknown }
  assert.equal(tabletUpdateResult.node?.id, nodeId, 'breakpoint changes must preserve semantic node identity')
  assert.equal(tabletUpdateResult.node?.layouts?.tablet?.width, 720, 'tablet width override must be applied')
  assert.equal(tabletUpdateResult.revision, 4, 'tablet override must advance the revision')
  const retryTabletUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: { projectId, expectedRevision: 3, changes: { layouts: responsiveLayouts } },
    jar: ownerJar,
  })
  assert.equal(retryTabletUpdate.status, 200, 'tablet override retry must be idempotent')
  const responsiveReadBack = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  const responsiveProject = await responsiveReadBack.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
  const responsiveNode = responsiveProject.project?.canvas?.nodes?.[nodeId]
  assert.equal(responsiveNode?.id, nodeId, 'same node id must remain across breakpoints')
  assert.equal(responsiveNode?.layouts.desktop.x, 64, 'desktop position must remain unchanged by tablet edits')
  assert.equal(responsiveNode?.layouts.tablet?.width, 720, 'tablet override must survive project reload')
  assert.equal(responsiveNode?.layouts.mobile?.width, 'fill', 'mobile layout must remain independent')
  assert.equal(responsiveProject.project?.revision, 4, 'responsive edit must persist its canvas revision')

  const previewListResponse = await request(baseUrl, '/api/projects', { jar: ownerJar })
  assert.equal(previewListResponse.ok, true, 'owner must reload the saved project preview')
  const previewList = await previewListResponse.json() as { projects?: Array<{ id?: unknown; nodeCount?: unknown; preview?: Array<{ kind?: unknown }> }> }
  const renderedProject = previewList.projects?.find((project) => project.id === projectId)
  assert.equal(renderedProject?.nodeCount, 2, 'project card block count must match persisted semantic nodes')
  assert.deepEqual(renderedProject?.preview?.map((item) => item.kind), ['structure', 'heading'], 'project card wireframe must reflect persisted block types')
  const hubReadBack = await request(baseUrl, '/projects', { jar: ownerJar })
  assert.match(await hubReadBack.text(), /2 blocks/, 'server-rendered project card must show the persisted canvas summary')

  const customBlockId = randomUUID()
  const customBlockName = `FORME E2E block ${runId}`
  const saveCustomBlock = await request(baseUrl, `/api/projects/${projectId}/blocks`, {
    method: 'POST',
    json: { id: customBlockId, expectedRevision: 4, nodeId: parentId, name: customBlockName },
    jar: ownerJar,
  })
  assert.equal(saveCustomBlock.status, 201, 'owner must save a selected subtree as a reusable block')
  const savedBlockResult = await saveCustomBlock.json() as { block?: CustomBlockDefinition; revision?: unknown }
  assert.equal(savedBlockResult.block?.name, customBlockName, 'custom block must retain its semantic name')
  assert.equal(savedBlockResult.revision, 5, 'saving a block template must advance canvas revision')
  const savedBlock = savedBlockResult.block!
  const retryCustomBlock = await request(baseUrl, `/api/projects/${projectId}/blocks`, {
    method: 'POST',
    json: { id: customBlockId, expectedRevision: 4, nodeId: parentId, name: customBlockName },
    jar: ownerJar,
  })
  assert.equal(retryCustomBlock.status, 200, 'replaying a committed custom block save must be idempotent')
  const retryCustomBlockResult = await retryCustomBlock.json() as { revision?: unknown; replayed?: unknown }
  assert.equal(retryCustomBlockResult.revision, 5, 'custom block retry must not advance revision twice')
  assert.equal(retryCustomBlockResult.replayed, true, 'custom block retry must be recognized')
  const customIdMap = Object.fromEntries(Object.keys(savedBlock.nodes).map((templateId) => [templateId, randomUUID()]))
  const customInstanceInput = { expectedRevision: 5, parentId: null, idMap: customIdMap }
  const customInstance = await request(baseUrl, `/api/projects/${projectId}/blocks/${customBlockId}/instances`, {
    method: 'POST',
    json: customInstanceInput,
    jar: ownerJar,
  })
  assert.equal(customInstance.status, 201, 'owner must instantiate the saved custom block')
  const customInstanceResult = await customInstance.json() as { nodeId?: unknown; idMap?: Record<string, string>; revision?: unknown }
  const customRootId = customIdMap[savedBlock.rootId]
  assert.equal(customInstanceResult.nodeId, customRootId, 'custom instance must use its new root identity')
  assert.equal(customInstanceResult.revision, 6, 'custom instance must advance canvas revision')
  const retryCustomInstance = await request(baseUrl, `/api/projects/${projectId}/blocks/${customBlockId}/instances`, {
    method: 'POST',
    json: customInstanceInput,
    jar: ownerJar,
  })
  assert.equal(retryCustomInstance.status, 200, 'retrying a committed custom instance must be idempotent')
  const retryCustomResult = await retryCustomInstance.json() as { revision?: unknown; replayed?: unknown }
  assert.equal(retryCustomResult.replayed, true, 'custom instance retry must be recognized')
  assert.equal(retryCustomResult.revision, 6, 'custom instance retry must not advance revision twice')

  const customReadBack = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  const customProject = await customReadBack.json() as { project?: { canvas?: CanvasDocument; revision?: number } }
  assert.equal(customProject.project?.canvas?.customBlocks[customBlockId]?.name, customBlockName, 'custom block must persist in the canonical document')
  assert.equal(customProject.project?.canvas?.nodes?.[customRootId]?.customBlockId, customBlockId, 'reused node must reference its reusable block')
  assert.deepEqual(customProject.project?.canvas?.nodes?.[customRootId]?.children, [customIdMap[nodeId]], 'custom instance must preserve subtree hierarchy')
  assert.equal(customProject.project?.canvas?.nodes?.[customIdMap[nodeId]]?.layouts.tablet?.width, 720, 'custom reuse must retain the responsive template override')

  const replaceCanvasInput = { expectedRevision: 6, canvas: customProject.project!.canvas! }
  const replaceCanvas = await request(baseUrl, `/api/projects/${projectId}/canvas`, {
    method: 'PUT',
    json: replaceCanvasInput,
    jar: ownerJar,
  })
  assert.equal(replaceCanvas.ok, true, 'owner must replace a validated current document')
  const replaceResult = await replaceCanvas.json() as { revision?: unknown }
  assert.equal(replaceResult.revision, 7, 'document replace must advance the revision')
  const retryCanvasReplace = await request(baseUrl, `/api/projects/${projectId}/canvas`, {
    method: 'PUT',
    json: replaceCanvasInput,
    jar: ownerJar,
  })
  assert.equal(retryCanvasReplace.ok, true, 'replaying the same document save must recover successfully')
  const retryReplaceResult = await retryCanvasReplace.json() as { revision?: unknown; replayed?: unknown }
  assert.equal(retryReplaceResult.revision, 7, 'document save retry must not advance revision twice')
  assert.equal(retryReplaceResult.replayed, true, 'document save retry must be recognized')

  const openedProject = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  assert.equal(openedProject.status, 200, 'owner must read their project')
  const workspace = await request(baseUrl, `/workspace/${projectId}`, { jar: ownerJar })
  assert.equal(workspace.status, 200, 'owner must reopen the protected workspace')
  const workspaceHtml = await workspace.text()
  assert.match(workspaceHtml, new RegExp(`FORME E2E ${runId}`), 'workspace response must render the persisted project')
  assert.match(workspaceHtml, /Select/, 'workspace response must render the canvas selection tool')
  assert.match(workspaceHtml, /Text/, 'workspace response must render the canvas text tool')
  assert.match(workspaceHtml, /AI Composer/, 'workspace response must render the real scoped Composer surface')
  assert.match(workspaceHtml, /Bring your own model/, 'Composer must expose the canonical BYOK provider connection surface')
  assert.match(workspaceHtml, /Provider/, 'Composer must render the provider selector label')
  assert.match(workspaceHtml, /Inspector/, 'workspace response must render the node inspector')
  assert.match(workspaceHtml, /Layers/, 'workspace response must render the layer list')
  assert.match(workspaceHtml, /Section templates/, 'workspace response must render the section block catalog')
  assert.match(workspaceHtml, /Page title/, 'workspace response must render the persisted semantic node')
  assert.match(workspaceHtml, new RegExp(customBlockName), 'workspace response must render the saved custom block')

  const databaseProject = await pool.query<{ user_id: string; canvas_revision: number; canvas: { nodes?: Record<string, { label?: string }> } }>(
    'SELECT user_id, canvas_revision, canvas FROM projects WHERE id = $1::uuid',
    [projectId],
  )
  assert.equal(databaseProject.rows[0]?.user_id, ownerId, 'database row must be owned by the authenticated user')
  assert.equal(databaseProject.rows[0]?.canvas_revision, 7, 'database must retain the document revision')
  assert.equal(databaseProject.rows[0]?.canvas.nodes?.[nodeId]?.label, 'Page title', 'database JSONB must retain the node edit')
  const databaseSessions = await pool.query<{ count: number }>(
    'SELECT count(*)::int AS count FROM session WHERE user_id = $1 AND expires_at > now()',
    [ownerId],
  )
  assert.ok(databaseSessions.rows[0]?.count > 0, 'session must be persisted in PostgreSQL')
  pass('nested nodes, custom block save/reuse, layout edits, revision retry, reload, and database ownership')

  const otherJar = new CookieJar()
  await createAccount(baseUrl, emails[1], 'FORME E2E Other', otherJar)
  const otherProjects = await request(baseUrl, '/api/projects', { jar: otherJar })
  assert.equal(otherProjects.ok, true, 'second account may list its own projects')
  const otherList = await otherProjects.json() as { projects?: unknown[] }
  assert.equal(otherList.projects?.length, 0, 'second account must not see owner projects')

  const deniedProject = await request(baseUrl, `/api/projects/${projectId}`, { jar: otherJar })
  assert.equal(deniedProject.status, 404, 'cross-owner project reads must be concealed as not found')
  const deniedNodeCreate = await request(baseUrl, '/api/nodes', {
    method: 'POST',
    json: { id: randomUUID(), projectId, expectedRevision: 7, blockId: 'heading' },
    jar: otherJar,
  })
  assert.equal(deniedNodeCreate.status, 404, 'other accounts must not create nodes in a private project')
  const deniedNodeUpdate = await request(baseUrl, `/api/nodes/${nodeId}`, {
    method: 'PATCH',
    json: { projectId, expectedRevision: 7, changes: { label: 'Unauthorized' } },
    jar: otherJar,
  })
  assert.equal(deniedNodeUpdate.status, 404, 'other accounts must not update private nodes')
  const deniedCustomBlock = await request(baseUrl, `/api/projects/${projectId}/blocks`, {
    method: 'POST',
    json: { id: randomUUID(), expectedRevision: 6, nodeId: parentId, name: 'Unauthorized block' },
    jar: otherJar,
  })
  assert.equal(deniedCustomBlock.status, 404, 'other accounts must not save private custom blocks')
  const deniedCustomInstance = await request(baseUrl, `/api/projects/${projectId}/blocks/${customBlockId}/instances`, {
    method: 'POST',
    json: { expectedRevision: 6, parentId: null, idMap: customIdMap },
    jar: otherJar,
  })
  assert.equal(deniedCustomInstance.status, 404, 'other accounts must not instantiate private custom blocks')
  const deniedWorkspace = await request(baseUrl, `/workspace/${projectId}`, { jar: otherJar })
  assert.equal(deniedWorkspace.status, 404, 'cross-owner workspace access must be denied')
  pass('cross-account project and workspace isolation')

  const deleteCustomInput = { projectId, expectedRevision: 7 }
  const deleteCustom = await request(baseUrl, `/api/nodes/${customRootId}`, {
    method: 'DELETE',
    json: deleteCustomInput,
    jar: ownerJar,
  })
  assert.equal(deleteCustom.status, 200, 'owner must delete a custom block instance')
  const retriedCustomDelete = await request(baseUrl, `/api/nodes/${customRootId}`, {
    method: 'DELETE',
    json: deleteCustomInput,
    jar: ownerJar,
  })
  assert.equal(retriedCustomDelete.status, 200, 'replaying custom subtree deletion must be idempotent')
  const deleteInput = { projectId, expectedRevision: 8 }
  const deleteNode = await request(baseUrl, `/api/nodes/${parentId}`, {
    method: 'DELETE',
    json: deleteInput,
    jar: ownerJar,
  })
  assert.equal(deleteNode.status, 200, 'owner must delete the source subtree')
  const retriedDelete = await request(baseUrl, `/api/nodes/${parentId}`, {
    method: 'DELETE',
    json: deleteInput,
    jar: ownerJar,
  })
  assert.equal(retriedDelete.status, 200, 'replaying source subtree deletion must be idempotent')
  const afterDelete = await request(baseUrl, `/api/projects/${projectId}`, { jar: ownerJar })
  const afterDeleteResult = await afterDelete.json() as { project?: { canvas?: { nodes?: Record<string, unknown> }; revision?: number } }
  assert.equal(Object.keys(afterDeleteResult.project?.canvas?.nodes ?? {}).length, 0, 'deletion must persist without orphan nodes')
  assert.equal(afterDeleteResult.project?.revision, 9, 'subtree deletes must each advance the canvas revision once')
  const workspaceAfterDelete = await request(baseUrl, `/workspace/${projectId}`, { jar: ownerJar })
  assert.match(await workspaceAfterDelete.text(), /Blank canvas/, 'reloaded workspace must render its empty state after deletion')
  pass('subtree deletion and retry are persistent and idempotent')

  await runGeminiJourney(baseUrl, pool, ownerId, ownerJar, otherJar)

  const ownerSignOut = await request(baseUrl, '/api/auth/sign-out', { method: 'POST', json: {}, jar: ownerJar })
  const signOutBody = await ownerSignOut.clone().json().catch(() => undefined) as { code?: unknown } | undefined
  assert.equal(ownerSignOut.ok, true, `owner sign-out must complete (HTTP ${ownerSignOut.status}${typeof signOutBody?.code === 'string' ? ` ${signOutBody.code}` : ''})`)
  const signedOutProjects = await request(baseUrl, '/api/projects', { jar: ownerJar })
  assert.equal(signedOutProjects.status, 401, 'signed-out session must lose project access')
  const anonymousWorkspace = await request(baseUrl, `/workspace/${projectId}`)
  assert.ok([307, 308].includes(anonymousWorkspace.status), 'anonymous workspace request must redirect to sign-in')
  for (const path of ['/projects', '/generator', '/cloning']) {
    const response = await request(baseUrl, path)
    assert.ok([307, 308].includes(response.status), `${path} must remain protected after sign-out`)
  }

  await request(baseUrl, '/api/auth/sign-out', { method: 'POST', json: {}, jar: ownerSignupJar })
  await request(baseUrl, '/api/auth/sign-out', { method: 'POST', json: {}, jar: otherJar })
  pass('sign-out and unauthenticated access denial')
}

export async function runProductionE2E(targetBaseUrl: URL, databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, max: 2, connectionTimeoutMillis: timeoutMs })

  try {
    await pool.query('SELECT 1')
    await run(targetBaseUrl, pool)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown failure'
    process.stderr.write(`FAIL | production auth/project E2E: ${message}\n`)
    process.exitCode = 1
  } finally {
    let client: PoolClient | undefined
    try {
      client = await pool.connect()
      const matchingUsers = await client.query<{ id: string }>(
        'SELECT id FROM "user" WHERE email = ANY($1::text[])',
        [emails],
      )
      const cleanupIds = [...new Set([...userIds, ...matchingUsers.rows.map((row) => row.id)])]
      await client.query('BEGIN')
      await client.query('DELETE FROM projects WHERE id = ANY($1::uuid[])', [[...projectIds]])
      await client.query('DELETE FROM verification WHERE identifier = ANY($1::text[])', [emails])
      await client.query('DELETE FROM "user" WHERE id = ANY($1::text[])', [cleanupIds])
      await client.query('COMMIT')
      pass('temporary E2E accounts and projects cleaned up')
    } catch {
      await client?.query('ROLLBACK').catch(() => undefined)
      process.stderr.write('FAIL | E2E cleanup failed; inspect the isolated test database before rerunning\n')
      process.exitCode = 1
    } finally {
      client?.release()
      await pool.end()
    }
  }
}

async function main() {
  assert.ok(Number.isInteger(timeoutMs) && timeoutMs >= 1_000 && timeoutMs <= 60_000, 'E2E_TIMEOUT_MS must be 1000–60000')
  const baseUrl = resolveBaseUrl()
  const databaseUrl = process.env.E2E_DATABASE_URL ?? requiredEnvironment('DATABASE_URL')
  await runProductionE2E(baseUrl, databaseUrl)
}

// Only auto-run when executed directly. The orchestrator imports this module
// and calls `runProductionE2E` itself, so a blind auto-run would launch a
// second, duplicated journey against a possibly stale base URL.
if (process.env.FORME_E2E_NO_AUTORUN !== '1') {
  main().catch(() => {
    process.stderr.write('FAIL | E2E configuration or setup error (check required E2E environment variables)\n')
    process.exitCode = 1
  })
}
