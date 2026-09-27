export const activeProviderIds = [
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

export type ProviderId = typeof activeProviderIds[number]
export type ProviderCapability = 'text-generation' | 'structured-output'
export type ProviderModelStatus = 'discovered' | 'validated'

export type ProviderConfiguration = {
  baseUrl?: string
  modelId?: string
}

export type ProviderAdapterInput = {
  apiKey: string
  configuration: ProviderConfiguration
}

export class ProviderAdapterError extends Error {
  constructor(readonly code: string, readonly status: number, readonly outcomeUnknown = false, readonly providerStatus?: number) {
    super(code)
  }
}

export type ProviderModel = {
  id: string
  displayName: string
  description: string
  inputTokenLimit?: number
  outputTokenLimit?: number
  capabilities: ProviderCapability[]
  status: ProviderModelStatus
}

export type ProviderConnectionSummary = {
  id: string
  provider: ProviderId
  verifiedAt: Date | string | null
  models: Array<ProviderModel & { syncedAt?: Date | string | null }>
}

export type ScopedEditRequest = {
  modelId: string
  node: { type: string; label: string; text: string }
  instruction: string
}

export interface FormeProviderAdapter {
  readonly provider: ProviderId
  readonly modelDiscovery: 'live' | 'manual' | 'live-or-manual'
  validateCredentials(input: ProviderAdapterInput): Promise<ProviderModel[]>
  listModels(input: ProviderAdapterInput): Promise<ProviderModel[]>
  validateModel(input: ProviderAdapterInput, modelId: string): Promise<ProviderModel>
  generateStructuredEdit(input: ProviderAdapterInput & { request: ScopedEditRequest }): Promise<string>
}
