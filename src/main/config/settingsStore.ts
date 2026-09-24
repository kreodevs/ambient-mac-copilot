import { EventEmitter } from 'node:events'
import type { AgentId, AppSettings, ProviderProfile } from '../../shared/types.js'
import { getDatabase } from '../db/database.js'
import {
  deleteProvider,
  getAppSecret,
  hasAppSecret,
  listProviders,
  setAppSecret,
  upsertProvider,
} from '../db/providerRepository.js'
import { ensureDefaultThread } from '../db/contextRepository.js'

const DEFAULT_ORCHESTRATOR_MODEL = 'google/gemini-2.5-flash'

/** OpenRouter retira modelos con el tiempo; mapeo al reemplazo vigente. */
const DEPRECATED_MODEL_IDS: Record<string, string> = {
  'google/gemini-2.0-flash-001': DEFAULT_ORCHESTRATOR_MODEL,
  'google/gemini-flash-1.5': DEFAULT_ORCHESTRATOR_MODEL,
}

function normalizeModelId(model: string): string {
  return DEPRECATED_MODEL_IDS[model] ?? model
}

function normalizeAgents(
  agents: Partial<AppSettings['agents']> | undefined,
): AppSettings['agents'] {
  const base = { ...DEFAULT_SETTINGS.agents, ...agents }
  const normalized = { ...base }
  for (const key of Object.keys(normalized) as Array<keyof AppSettings['agents']>) {
    const binding = normalized[key]
    if (binding?.model) {
      normalized[key] = { ...binding, model: normalizeModelId(binding.model) }
    }
  }
  return normalized
}

const DEFAULT_SETTINGS: AppSettings = {
  providers: [
    {
      id: 'openrouter-main',
      name: 'OpenRouter',
      preset: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      supportsSystemOne: true,
    },
    {
      id: '9router-local',
      name: '9router Local',
      preset: '9router',
      baseUrl: 'http://localhost:20128/v1',
      supportsSystemOne: false,
    },
  ],
  agents: {
    orchestrator: {
      providerId: 'openrouter-main',
      model: DEFAULT_ORCHESTRATOR_MODEL,
      enabled: true,
    },
    jev: {
      providerId: 'openrouter-main',
      model: '~typesafe/jev-latest',
      enabled: true,
    },
    screenVision: {
      providerId: 'openrouter-main',
      model: DEFAULT_ORCHESTRATOR_MODEL,
      enabled: true,
    },
    meetingSummarizer: {
      providerId: 'openrouter-main',
      model: DEFAULT_ORCHESTRATOR_MODEL,
      enabled: true,
    },
    cloudStt: {
      providerId: '9router-local',
      model: 'openai/whisper-1',
      enabled: true,
    },
  },
  jev: { minConfidence: 0.7 },
  stt: {
    provider: 'apple',
    language: 'es',
  },
  tts: {
    provider: 'macos',
    macosVoice: 'Monica',
    kokoroVoice: 'ef_dora',
    speed: 1.0,
    dtype: 'q8',
    outputDeviceId: 'headphones-preferred',
  },
  audio: {
    activationMode: 'push-to-talk',
    pushToTalkShortcut: 'Command+Shift+V',
    wakeWord: 'computer',
    blackholeDeviceIndex: 1,
    ffmpegPath: '/opt/homebrew/bin/ffmpeg',
  },
  onboardingCompleted: false,
  windowPinned: false,
}

const emitter = new EventEmitter()

function getPref<T>(key: string): T | null {
  const row = getDatabase()
    .prepare('SELECT value FROM app_preferences WHERE key = ?')
    .get(key) as { value: string } | undefined
  if (!row) return null
  return JSON.parse(row.value) as T
}

function setPref(key: string, value: unknown): void {
  getDatabase()
    .prepare(
      `INSERT INTO app_preferences (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, JSON.stringify(value))
}

function seedDefaults(): void {
  const providers = listProviders()
  if (providers.length === 0) {
    for (const p of DEFAULT_SETTINGS.providers) {
      upsertProvider(p)
    }
  }

  if (!getPref<AppSettings>('settings')) {
    setPref('settings', {
      agents: DEFAULT_SETTINGS.agents,
      jev: DEFAULT_SETTINGS.jev,
      stt: DEFAULT_SETTINGS.stt,
      tts: DEFAULT_SETTINGS.tts,
      audio: DEFAULT_SETTINGS.audio,
      onboardingCompleted: false,
    })
  }

  ensureDefaultThread()
}

export function initSettingsStore(): void {
  seedDefaults()
}

function normalizeTts(
  tts: Partial<AppSettings['tts']> & { voice?: string } | undefined,
): AppSettings['tts'] {
  const legacyVoice = tts?.voice
  const merged = { ...DEFAULT_SETTINGS.tts, ...tts }
  const provider =
    merged.provider === 'auto' || merged.provider === 'macos'
      ? 'macos'
      : merged.provider ?? DEFAULT_SETTINGS.tts.provider

  return {
    provider,
    macosVoice: merged.macosVoice ?? legacyVoice ?? DEFAULT_SETTINGS.tts.macosVoice,
    kokoroVoice: merged.kokoroVoice ?? legacyVoice ?? DEFAULT_SETTINGS.tts.kokoroVoice,
    speed: merged.speed ?? DEFAULT_SETTINGS.tts.speed,
    dtype: merged.dtype ?? DEFAULT_SETTINGS.tts.dtype,
    outputDeviceId: merged.outputDeviceId ?? DEFAULT_SETTINGS.tts.outputDeviceId,
  }
}

function normalizeStt(stt: Partial<AppSettings['stt']> & { provider?: string } | undefined): AppSettings['stt'] {
  const merged = { ...DEFAULT_SETTINGS.stt, ...stt }
  const provider =
    merged.provider === 'moonshine' ? 'apple' : (merged.provider ?? DEFAULT_SETTINGS.stt.provider)
  return {
    provider: provider as AppSettings['stt']['provider'],
    language: merged.language ?? DEFAULT_SETTINGS.stt.language,
  }
}

export function getSettings(): AppSettings {
  const stored = getPref<Partial<AppSettings>>('settings') ?? {}
  const providers = listProviders().map((p) => ({
    ...p,
    apiKeyMasked: p.apiKeyMasked,
  }))

  return {
    providers,
    agents: normalizeAgents(stored.agents),
    jev: stored.jev ?? DEFAULT_SETTINGS.jev,
    stt: normalizeStt(stored.stt),
    tts: normalizeTts(stored.tts),
    audio: {
      ...DEFAULT_SETTINGS.audio,
      ...(stored.audio ?? {}),
      activationMode: stored.audio?.activationMode ?? DEFAULT_SETTINGS.audio.activationMode,
      pushToTalkShortcut: stored.audio?.pushToTalkShortcut ?? DEFAULT_SETTINGS.audio.pushToTalkShortcut,
      picovoiceAccessKeyMasked: hasAppSecret('picovoice'),
    },
    onboardingCompleted: stored.onboardingCompleted ?? false,
    windowPinned: stored.windowPinned ?? DEFAULT_SETTINGS.windowPinned,
  }
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const current = getPref<Partial<AppSettings>>('settings') ?? {}
  const { providers, ...rest } = partial

  if (providers) {
    const existingIds = new Set(listProviders().map((p) => p.id))
    const newIds = new Set(providers.map((p) => p.id))

    for (const p of providers) {
      upsertProvider(p)
    }

    for (const id of existingIds) {
      if (!newIds.has(id) && listProviders().length > 1) {
        deleteProvider(id)
      }
    }
  }

  const merged = { ...current, ...rest }
  setPref('settings', merged)
  emitter.emit('settings:changed', getSettings())
}

export function updatePicovoiceKey(key: string): void {
  setAppSecret('picovoice', key)
  emitter.emit('settings:changed', getSettings())
}

export function getPicovoiceKey(): string | null {
  return getAppSecret('picovoice')
}

export function onSettingsChanged(cb: (settings: AppSettings) => void): () => void {
  emitter.on('settings:changed', cb)
  return () => emitter.off('settings:changed', cb)
}

export function getAgentBinding(agentId: AgentId) {
  return getSettings().agents[agentId]
}

export function getProviderById(id: string): ProviderProfile | null {
  return listProviders().find((p) => p.id === id) ?? null
}

export function completeOnboarding(): void {
  const current = getPref<Partial<AppSettings>>('settings') ?? {}
  setPref('settings', { ...current, onboardingCompleted: true })
}
