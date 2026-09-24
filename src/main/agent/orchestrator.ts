import { getLLMClientForAgent } from '../config/providerRegistry.js'
import { getAgentBinding } from '../config/settingsStore.js'
import { JevRouter } from './jev/jevRouter.js'
import { executeTool } from './toolRegistry.js'
import * as contextStore from './contextStore.js'
import { captureActiveDisplayBase64 } from '../screen/screenCapture.js'

const jevRouter = new JevRouter()

const SYSTEM_PROMPT = `Eres Ambient Mac Copilot, un asistente de productividad para macOS.
Responde en español de forma concisa. Tienes acceso a Mail.app (listar, buscar, leer correos), pantalla, recordatorios, notas y controles del sistema.
Si el usuario pide correos, resume los resultados con remitente y asunto. No digas que no puedes acceder al correo si Mail.app está configurado.`

export async function run(
  userText: string,
  threadId: string,
): Promise<{ reply: string; actionData?: unknown }> {
  contextStore.appendMessage(threadId, { role: 'user', content: userText })
  contextStore.autoTitleFromMessage(threadId, userText)

  const jevResult = await jevRouter.classify(userText)
  if (jevRouter.shouldFastPath(jevResult) && jevResult.tool) {
    const toolResult = await executeTool(jevResult.tool, jevResult.args ?? {})
    const actionData =
      toolResult.status === 'preview'
        ? toolResult.actionData
        : toolResult.status === 'ok'
          ? toolResult.actionData
          : undefined
    contextStore.appendMessage(threadId, {
      role: 'assistant',
      content: toolResult.reply,
      actionData,
    })
    return { reply: toolResult.reply, actionData }
  }

  const history = contextStore.getMessages(threadId, 20)
  const binding = getAgentBinding('orchestrator')
  const client = getLLMClientForAgent('orchestrator')

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ]

  const reply = await client.chat(messages, binding.model)
  contextStore.appendMessage(threadId, { role: 'assistant', content: reply })
  return { reply }
}

export async function runScreenAnalysis(
  query: string,
  threadId: string,
): Promise<{ analysis: string }> {
  const image = await captureActiveDisplayBase64()
  const binding = getAgentBinding('screenVision')
  const client = getLLMClientForAgent('screenVision')
  const analysis = await client.chatWithVision(
    [{ role: 'user', content: query }],
    image,
    binding.model,
  )

  contextStore.appendMessage(threadId, { role: 'user', content: `[Pantalla] ${query}` })
  contextStore.appendMessage(threadId, { role: 'assistant', content: analysis })
  return { analysis }
}

export async function testAgentConnection(
  agentId: 'orchestrator' | 'jev' | 'screenVision' | 'meetingSummarizer' | 'cloudStt',
): Promise<{ ok: boolean; error?: string }> {
  try {
    const binding = getAgentBinding(agentId)
    const client = getLLMClientForAgent(agentId)
    const result = await client.testConnection(binding.model)
    return result.ok ? { ok: true } : { ok: false, error: result.error ?? 'Connection test failed' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function testProviderConnection(providerId: string): Promise<{
  ok: boolean
  supportsSystemOne?: boolean
  error?: string
}> {
  try {
    const { getProviderById } = await import('../config/settingsStore.js')
    const { OpenAICompatibleProvider } = await import('./llm/OpenAICompatibleProvider.js')
    const { getProviderApiKey } = await import('../db/providerRepository.js')
    const profile = getProviderById(providerId)
    if (!profile) return { ok: false, error: 'Provider not found' }

    const apiKey = getProviderApiKey(providerId) ?? ''
    if (!apiKey.trim() && profile.preset === 'openrouter') {
      return { ok: false, error: 'API key no configurada. Usa OPENROUTER_API_KEY o Ajustes → Proveedores.' }
    }

    const client = new OpenAICompatibleProvider(profile, apiKey)
    const binding = getAgentBinding('orchestrator')
    const result = await client.testConnection(binding.model)
    return {
      ok: result.ok,
      supportsSystemOne: profile.supportsSystemOne,
      error: result.error,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
