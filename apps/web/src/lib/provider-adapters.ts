import { anthropicProviderAdapter } from './anthropic-provider'
import { chatCompletionsAdapters } from './chat-completions-provider'
import { geminiProviderAdapter } from './gemini-provider'
import type { FormeProviderAdapter, ProviderId } from './provider-types'

const adapters: Record<ProviderId, FormeProviderAdapter> = {
  'meta-muse': chatCompletionsAdapters['meta-muse'],
  openai: chatCompletionsAdapters.openai,
  'anthropic-claude': anthropicProviderAdapter,
  'google-gemini': geminiProviderAdapter,
  'alibaba-qwen': chatCompletionsAdapters['alibaba-qwen'],
  'zai-glm': chatCompletionsAdapters['zai-glm'],
  'xiaomi-mimo': chatCompletionsAdapters['xiaomi-mimo'],
  'xai-grok': chatCompletionsAdapters['xai-grok'],
  'moonshot-kimi': chatCompletionsAdapters['moonshot-kimi'],
  deepseek: chatCompletionsAdapters.deepseek,
  minimax: chatCompletionsAdapters.minimax,
  'openai-compatible': chatCompletionsAdapters['openai-compatible'],
}

export function getProviderAdapter(provider: string) {
  return Object.hasOwn(adapters, provider) ? adapters[provider as ProviderId] : null
}
