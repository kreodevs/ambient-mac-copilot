import OpenAI from 'openai'
import fs from 'node:fs'
import type { ProviderProfile } from '../../../shared/types.js'
import type { ChatCompletionMessage, LLMProvider } from './types.js'
import { isJevModel, submitJevDecision } from '../jev/jevDecisions.js'

function formatLlmError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; status?: number; error?: { message?: string } }
    if (e.error?.message) return e.error.message
    if (e.message) return e.message
  }
  return String(err)
}

export class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI
  private apiKey: string

  constructor(
    public profile: ProviderProfile,
    apiKey: string,
  ) {
    this.apiKey = apiKey
    const headers: Record<string, string> = {}
    if (profile.preset === 'openrouter') {
      headers['HTTP-Referer'] = 'https://ambient-mac-copilot.local'
      headers['X-Title'] = 'Ambient Mac Copilot'
    }

    this.client = new OpenAI({
      apiKey: apiKey || 'not-needed',
      baseURL: profile.baseUrl,
      defaultHeaders: headers,
    })
  }

  async chat(messages: ChatCompletionMessage[], model: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content as string,
      })),
    })
    return response.choices[0]?.message?.content ?? ''
  }

  async chatWithVision(
    messages: ChatCompletionMessage[],
    imageBase64: string,
    model: string,
  ): Promise<string> {
    const visionMessages = [
      ...messages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content as string,
      })),
      {
        role: 'user' as const,
        content: [
          {
            type: 'text',
            text: typeof messages.at(-1)?.content === 'string' ? messages.at(-1)!.content as string : '',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${imageBase64}` },
          },
        ],
      },
    ]

    const response = await this.client.chat.completions.create({
      model,
      messages: visionMessages,
    })
    return response.choices[0]?.message?.content ?? ''
  }

  async transcribeAudio(filePath: string, model: string): Promise<string> {
    const file = fs.createReadStream(filePath)
    const response = await this.client.audio.transcriptions.create({
      file,
      model,
    })
    return response.text
  }

  async testConnection(model: string): Promise<{ ok: boolean; error?: string }> {
    if (this.profile.preset === 'openrouter' && !this.apiKey.trim()) {
      return { ok: false, error: 'API key no configurada para OpenRouter' }
    }

    try {
      if (isJevModel(model)) {
        await submitJevDecision(this.profile, this.apiKey, model, 'test', {
          intent: {
            type: 'choice',
            instructions: 'Connectivity test',
            criteria: {
              general_chat: 'General chat',
              mail_triage: 'Email triage',
            },
          },
        })
        return { ok: true }
      }

      await this.chat([{ role: 'user', content: 'ping' }], model)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: formatLlmError(err) }
    }
  }
}
