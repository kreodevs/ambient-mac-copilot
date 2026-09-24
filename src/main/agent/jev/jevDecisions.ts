import type { ProviderProfile } from '../../../shared/types.js'

export interface JevChoiceAnswer {
  type: 'choice'
  choice?: string
  confidence?: number
  probabilities?: Record<string, number>
}

export interface JevDecisionsResponse {
  answers: Record<string, JevChoiceAnswer>
}

export function isJevModel(model: string): boolean {
  return /jev/i.test(model) || model.startsWith('~typesafe/')
}

export function resolveDecisionsUrl(profile: ProviderProfile): string {
  if (profile.preset === 'openrouter') {
    return 'https://openrouter.ai/api/alpha/decisions'
  }
  const base = profile.baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')
  return `${base}/alpha/decisions`
}

export async function submitJevDecision(
  profile: ProviderProfile,
  apiKey: string,
  model: string,
  state: string,
  questions: Record<string, unknown>,
): Promise<JevDecisionsResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey || 'not-needed'}`,
    'Content-Type': 'application/json',
  }

  if (profile.preset === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ambient-mac-copilot.local'
    headers['X-Title'] = 'Ambient Mac Copilot'
  }

  const response = await fetch(resolveDecisionsUrl(profile), {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, state, questions }),
  })

  const body = await response.text()
  if (!response.ok) {
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } }
      throw new Error(parsed.error?.message ?? body)
    } catch {
      throw new Error(body || `Jev decisions failed (${response.status})`)
    }
  }

  return JSON.parse(body) as JevDecisionsResponse
}
