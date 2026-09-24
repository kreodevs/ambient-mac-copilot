import type { ProviderProfile } from '../../../shared/types.js'
import { getAgentBinding, getSettings } from '../../config/settingsStore.js'
import { getProviderApiKey } from '../../db/providerRepository.js'
import { getLLMClientForAgent } from '../../config/providerRegistry.js'
import { inferMailFlags, stripMailBoilerplate } from '../tools/mailArgs.js'
import { CHOICE_TO_TOOL, JEV_CHOICES, type JevChoiceId } from './intentPlaybooks.js'
import { isJevModel, submitJevDecision } from './jevDecisions.js'

export interface JevClassification {
  choice: JevChoiceId
  confidence: number
  tool?: string
  args?: Record<string, unknown>
}

const VALID_CHOICES = new Set<JevChoiceId>(JEV_CHOICES.map((c) => c.id))

function buildToolArgs(choice: JevChoiceId, userText: string): Record<string, unknown> {
  const flags = inferMailFlags(userText)
  const searchQuery = stripMailBoilerplate(userText)

  switch (choice) {
    case 'mail_list':
      return { query: userText, ...flags, limit: 15 }
    case 'mail_search':
      return { query: searchQuery || userText, ...flags, limit: 15 }
    case 'mail_read':
      return { query: userText, ...flags }
    case 'mail_triage':
      return { query: userText, limit: 15, autoArchiveJunk: true }
    default:
      return { query: userText }
  }
}

export class JevRouter {
  async classify(userText: string): Promise<JevClassification> {
    const settings = getSettings()
    const binding = getAgentBinding('jev')

    if (!binding.enabled) {
      return { choice: 'general_chat', confidence: 0 }
    }

    const provider = settings.providers.find((p) => p.id === binding.providerId)
    if (!provider?.supportsSystemOne) {
      return { choice: 'general_chat', confidence: 0 }
    }

    try {
      if (isJevModel(binding.model)) {
        return await this.classifyWithDecisions(userText, provider, binding.model)
      }
      return await this.classifyWithChat(userText, binding.model)
    } catch (err) {
      console.warn('[JevRouter] classification failed:', err)
      return { choice: 'general_chat', confidence: 0 }
    }
  }

  private async classifyWithDecisions(
    userText: string,
    provider: ProviderProfile,
    model: string,
  ): Promise<JevClassification> {
    const binding = getAgentBinding('jev')
    const apiKey = getProviderApiKey(binding.providerId) ?? ''
    const criteria = Object.fromEntries(JEV_CHOICES.map((c) => [c.id, c.label]))

    const response = await submitJevDecision(provider, apiKey, model, userText, {
      intent: {
        type: 'choice',
        instructions: 'Clasifica la intención del mensaje del usuario en macOS.',
        criteria,
      },
    })

    const answer = response.answers.intent
    const choice = answer?.choice as JevChoiceId | undefined
    if (!choice || !VALID_CHOICES.has(choice)) {
      return { choice: 'general_chat', confidence: 0 }
    }

    const confidence = answer.confidence ?? answer.probabilities?.[choice] ?? 0
    const tool = CHOICE_TO_TOOL[choice]

    return {
      choice,
      confidence,
      tool,
      args: tool ? buildToolArgs(choice, userText) : undefined,
    }
  }

  private async classifyWithChat(userText: string, model: string): Promise<JevClassification> {
    const client = getLLMClientForAgent('jev')
    const choicesText = JEV_CHOICES.map((c) => `- ${c.id}: ${c.label}`).join('\n')

    const prompt = `Classify the user intent. Reply ONLY with JSON: {"choice":"<id>","confidence":0.0-1.0}

Choices:
${choicesText}

User: ${userText}`

    const raw = await client.chat([{ role: 'user', content: prompt }], model)
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return { choice: 'general_chat', confidence: 0 }

    const parsed = JSON.parse(match[0]) as { choice: JevChoiceId; confidence: number }
    const tool = CHOICE_TO_TOOL[parsed.choice]

    return {
      choice: parsed.choice,
      confidence: parsed.confidence ?? 0,
      tool,
      args: tool ? buildToolArgs(parsed.choice, userText) : undefined,
    }
  }

  shouldFastPath(result: JevClassification): boolean {
    const minConfidence = getSettings().jev.minConfidence
    if (result.choice === 'mail_send') {
      return false
    }
    return (
      !!result.tool &&
      result.confidence >= minConfidence &&
      result.choice !== 'general_chat' &&
      result.choice !== 'complex'
    )
  }
}
