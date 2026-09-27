import assert from 'node:assert/strict'
import test from 'node:test'
import { connectProviderInputSchema, providerIdSchema, scopedGenerationInputSchema } from './provider-input'

const providers = [
  'meta-muse',
  'openai',
  'anthropic-claude',
  'google-gemini',
  'alibaba-qwen',
  'zai-glm',
  'xiaomi-mimo',
  'xai-grok',
  'moonshot-kimi',
  'deepseek',
  'minimax',
  'openai-compatible',
] as const

test('provider schema contains the approved active provider IDs but not Coming Soon Ignix', () => {
  for (const provider of providers) assert.equal(providerIdSchema.safeParse(provider).success, true)
  assert.equal(providerIdSchema.safeParse('ignix').success, false)
})

test('OpenAI-compatible connections require an HTTPS base URL and may carry a manual model ID', () => {
  assert.equal(connectProviderInputSchema.safeParse({
    provider: 'openai-compatible',
    apiKey: 'openai-compatible-test-key-123456',
    baseUrl: 'https://models.example/v1',
    modelId: 'local-instruct-14b',
  }).success, true)
  assert.equal(connectProviderInputSchema.safeParse({
    provider: 'openai-compatible',
    apiKey: 'openai-compatible-test-key-123456',
  }).success, false)
  assert.equal(connectProviderInputSchema.safeParse({
    provider: 'openai-compatible',
    apiKey: 'openai-compatible-test-key-123456',
    baseUrl: 'http://models.example/v1',
  }).success, false)
})

test('providers without documented model-list discovery require a manual model ID', () => {
  for (const provider of ['alibaba-qwen', 'zai-glm', 'xiaomi-mimo', 'moonshot-kimi']) {
    const result = connectProviderInputSchema.safeParse({
      provider,
      apiKey: 'provider-test-key-123456',
      ...(provider === 'alibaba-qwen' ? { baseUrl: 'https://workspace.region.maas.aliyuncs.com/compatible-mode/v1' } : {}),
      modelId: 'chosen-model',
    })
    assert.equal(result.success, true, `${provider} accepts an explicit model ID`)
    assert.equal(connectProviderInputSchema.safeParse({ provider, apiKey: 'provider-test-key-123456' }).success, false)
  }
})

test('generation requests accept all active providers and reject unsupported or malformed scope', () => {
  for (const provider of providers) {
    assert.equal(scopedGenerationInputSchema.safeParse({
      provider,
      modelId: 'chosen-model',
      nodeId: '80479a1c-2818-467b-8e20-8d4e9d6f5f71',
      expectedRevision: 1,
      idempotencyKey: 'a2d7d56d-9055-4920-a847-1804721e4f41',
      instruction: 'Rewrite the selected heading',
    }).success, true)
  }
  assert.equal(scopedGenerationInputSchema.safeParse({
    provider: 'ignix',
    modelId: 'chosen-model',
    nodeId: '80479a1c-2818-467b-8e20-8d4e9d6f5f71',
    expectedRevision: 1,
    idempotencyKey: 'a2d7d56d-9055-4920-a847-1804721e4f41',
    instruction: 'Rewrite the selected heading',
  }).success, false)
})
