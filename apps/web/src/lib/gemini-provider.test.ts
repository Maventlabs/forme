import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeGeminiModels } from './gemini-provider'

test('normalizes only live Gemini models that support generateContent', () => {
  const models = normalizeGeminiModels({
    models: [
      {
        name: 'models/gemini-fast',
        baseModelId: 'gemini-fast',
        displayName: 'Gemini Fast',
        description: 'Text generation model',
        supportedGenerationMethods: ['generateContent'],
        inputTokenLimit: 32_000,
        outputTokenLimit: 2_000,
      },
      {
        name: 'models/gemini-embedding',
        baseModelId: 'gemini-embedding',
        supportedGenerationMethods: ['embedContent'],
      },
    ],
  })

  assert.deepEqual(models, [{
    id: 'gemini-fast',
    displayName: 'Gemini Fast',
    description: 'Text generation model',
    inputTokenLimit: 32_000,
    outputTokenLimit: 2_000,
    capabilities: ['text-generation'],
    status: 'discovered',
  }])
})

test('rejects malformed Gemini model-list responses', () => {
  assert.deepEqual(normalizeGeminiModels({ models: [{ name: 'models/no-methods' }] }), [])
  assert.throws(() => normalizeGeminiModels({ models: 'not-an-array' }))
})
