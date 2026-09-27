import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createChatCompletionsAdapter,
  normalizeChatCompletionModels,
  type ChatCompletionsProfile,
} from './chat-completions-provider'
import type { ProviderTransportResponse, ProviderUrlDependencies } from './provider-url'

const baseProfile: ChatCompletionsProfile = {
  provider: 'openai-compatible',
  label: 'OpenAI-Compatible',
  modelDiscovery: 'live-or-manual',
  baseUrlRequired: true,
  credentialHeader: 'authorization-bearer',
  outputMode: 'json-object',
}

function response(body: unknown, statusCode = 200): ProviderTransportResponse {
  return { statusCode, body: Buffer.from(JSON.stringify(body)) }
}

test('normalizes only bounded live chat model records without a permanent catalog', () => {
  assert.deepEqual(normalizeChatCompletionModels({
    data: [
      { id: 'provider/model-a', name: 'Model A', context_length: 32_000 },
      { id: 'provider/model-a', name: 'Duplicate' },
      { id: 'embedding-v4' },
      { id: '', name: 'invalid' },
    ],
  }), [{
    id: 'provider/model-a',
    displayName: 'Model A',
    description: '',
    inputTokenLimit: 32_000,
    capabilities: ['text-generation'],
    status: 'discovered',
  }])
  assert.throws(() => normalizeChatCompletionModels({ data: 'not-an-array' }))
})

test('uses the compatible plural Chat Completions endpoint and validates a manual model through a real structured probe', async () => {
  const calls: Array<{ url: string; method: string; apiKey: string }> = []
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async () => [{ address: '93.184.216.34', family: 4 }],
    transport: async (url, options) => {
      calls.push({ url: url.href, method: options.method, apiKey: options.headers.authorization ?? '' })
      if (options.method === 'GET') return response({ data: [{ id: 'local-model' }] })
      return response({ choices: [{ message: { content: '{"operations":[{"op":"setNodeText","text":"FORME_PROVIDER_VALIDATION_OK"}]}' } }] })
    },
  }
  const adapter = createChatCompletionsAdapter(baseProfile, dependencies)
  const input = { apiKey: 'secret-never-returned-or-logged', configuration: { baseUrl: 'https://provider.example/v1/chat/completions' } }
  const discovered = await adapter.listModels(input)
  assert.equal(discovered[0]?.status, 'discovered')
  const validated = await adapter.validateModel(input, 'local-model')
  assert.equal(validated.id, 'local-model')
  assert.equal(validated.status, 'validated')
  assert.ok(validated.capabilities.includes('structured-output'))
  assert.equal(calls[0]?.url, 'https://provider.example/v1/models')
  assert.equal(calls[1]?.url, 'https://provider.example/v1/chat/completions')
  assert.equal(calls[1]?.method, 'POST')
  assert.equal(calls[1]?.apiKey, 'Bearer secret-never-returned-or-logged')
})

test('requires a manual model when discovery is unavailable and never reports an unverified model as ready', async () => {
  const dependencies: ProviderUrlDependencies = {
    resolveDns: async () => [{ address: '93.184.216.34', family: 4 }],
    transport: async (_url, options) => options.method === 'GET'
      ? response({ error: { message: 'not supported' } }, 404)
      : response({ choices: [{ message: { content: '{"operations":[{"op":"setNodeText","text":"FORME_PROVIDER_VALIDATION_OK"}]}' } }] }),
  }
  const adapter = createChatCompletionsAdapter(baseProfile, dependencies)
  const input = { apiKey: 'secret-never-returned-or-logged', configuration: { baseUrl: 'https://provider.example/v1' } }
  await assert.rejects(adapter.validateCredentials(input), /MODEL_ID_REQUIRED/)
  const manualInput = { ...input, configuration: { ...input.configuration, modelId: 'my-private-model' } }
  const validated = await adapter.validateCredentials(manualInput)
  assert.equal(validated.length, 1)
  assert.equal(validated[0]?.id, 'my-private-model')
  assert.equal(validated[0]?.status, 'validated')
})

test('maps provider credential, model, rate-limit and transient failures without exposing provider response text', async () => {
  const errorBodies = [
    [401, 'INVALID_CREDENTIAL', 422],
    [403, 'INVALID_CREDENTIAL', 422],
    [404, 'MODEL_DISCOVERY_UNAVAILABLE', 501],
    [429, 'PROVIDER_RATE_LIMITED', 429],
    [503, 'MODEL_DISCOVERY_UNAVAILABLE', 501],
  ] as const

  for (const [providerStatus, code, expectedStatus] of errorBodies) {
    const adapter = createChatCompletionsAdapter(baseProfile, {
      resolveDns: async () => [{ address: '93.184.216.34', family: 4 }],
      transport: async () => response({ error: { message: 'secret-sensitive provider response' } }, providerStatus),
    })
    await assert.rejects(adapter.listModels({
      apiKey: 'secret-never-returned-or-logged',
      configuration: { baseUrl: 'https://provider.example/v1' },
    }), (error: unknown) => {
      assert.equal((error as { code?: string }).code, code)
      assert.equal((error as { status?: number }).status, expectedStatus)
      assert.equal((error as Error).message.includes('secret-sensitive'), false)
      return true
    })
  }
})
