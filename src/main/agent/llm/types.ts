import type { ProviderProfile } from '../../../shared/types.js'

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export interface LLMProvider {
  profile: ProviderProfile
  chat(messages: ChatCompletionMessage[], model: string): Promise<string>
  chatWithVision(
    messages: ChatCompletionMessage[],
    imageBase64: string,
    model: string,
  ): Promise<string>
  transcribeAudio(filePath: string, model: string): Promise<string>
  testConnection(model: string): Promise<{ ok: boolean; error?: string }>
}
