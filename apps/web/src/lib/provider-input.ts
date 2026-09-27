import { z } from 'zod'
import { normalizeProviderBaseUrl } from './provider-url'
import { activeProviderIds } from './provider-types'

export const providerIdSchema = z.enum(activeProviderIds)

const providerModelIdSchema = z.string().trim().min(1).max(256).regex(/^[^\u0000-\u001f\u007f]+$/)
const providerBaseUrlSchema = z.string().trim().min(1).max(2_048).transform((value, context) => {
  try {
    return normalizeProviderBaseUrl(value)
  } catch {
    context.addIssue({ code: 'custom', message: 'INVALID_PROVIDER_BASE_URL' })
    return z.NEVER
  }
})

const manualModelProviders = new Set(['alibaba-qwen', 'zai-glm', 'xiaomi-mimo', 'moonshot-kimi'])

export const connectProviderInputSchema = z.object({
  provider: providerIdSchema,
  apiKey: z.string().trim().min(1).max(8_192),
  baseUrl: providerBaseUrlSchema.optional(),
  modelId: providerModelIdSchema.optional(),
}).strict().superRefine((input, context) => {
  const requiresBaseUrl = input.provider === 'openai-compatible' || input.provider === 'alibaba-qwen'
  if (requiresBaseUrl && !input.baseUrl) {
    context.addIssue({ code: 'custom', path: ['baseUrl'], message: 'PROVIDER_BASE_URL_REQUIRED' })
  }
  if (!requiresBaseUrl && input.baseUrl) {
    context.addIssue({ code: 'custom', path: ['baseUrl'], message: 'PROVIDER_BASE_URL_NOT_SUPPORTED' })
  }
  if (manualModelProviders.has(input.provider) && !input.modelId) {
    context.addIssue({ code: 'custom', path: ['modelId'], message: 'PROVIDER_MODEL_ID_REQUIRED' })
  }
})

export const scopedGenerationInputSchema = z.object({
  nodeId: z.string().uuid(),
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
  provider: providerIdSchema,
  modelId: providerModelIdSchema,
  instruction: z.string().trim().min(1).max(1_000),
}).strict()

export const validateProviderModelInputSchema = z.object({
  modelId: providerModelIdSchema,
}).strict()
