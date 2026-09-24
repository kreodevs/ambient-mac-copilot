import type { AgentId } from '../../shared/types.js'
import { getAgentBinding, getProviderById, getSettings, onSettingsChanged } from './settingsStore.js'
import { getProviderApiKey } from '../db/providerRepository.js'
import { OpenAICompatibleProvider } from '../agent/llm/OpenAICompatibleProvider.js'

const clientCache = new Map<string, OpenAICompatibleProvider>()

function buildClient(providerId: string): OpenAICompatibleProvider | null {
  const profile = getProviderById(providerId)
  if (!profile) return null

  const apiKey = getProviderApiKey(providerId) ?? ''
  const client = new OpenAICompatibleProvider(profile, apiKey)
  clientCache.set(providerId, client)
  return client
}

export function rebuildClientCache(): void {
  clientCache.clear()
  const settings = getSettings()
  for (const p of settings.providers) {
    buildClient(p.id)
  }
}

export function getLLMClientForAgent(agentId: AgentId): OpenAICompatibleProvider {
  const binding = getAgentBinding(agentId)
  const client = clientCache.get(binding.providerId) ?? buildClient(binding.providerId)
  if (!client) {
    throw new Error(`No provider configured for agent "${agentId}" (provider: ${binding.providerId})`)
  }
  return client
}

export function resolveSystemOneUrl(providerId: string): string | null {
  const profile = getProviderById(providerId)
  if (!profile?.supportsSystemOne) return null
  const base = profile.baseUrl.replace(/\/$/, '')
  return `${base}/systemone`
}

export function initProviderRegistry(): void {
  rebuildClientCache()
  onSettingsChanged(() => rebuildClientCache())
}
