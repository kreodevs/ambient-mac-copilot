import { ipcMain, BrowserWindow } from 'electron'
import type { AgentId, AppSettings, CopilotState } from '../../shared/types.js'
import { IPC_CHANNELS } from './ipcChannels.js'
import * as orchestrator from '../agent/orchestrator.js'
import * as contextStore from '../agent/contextStore.js'
import {
  completeOnboarding,
  getSettings,
  updatePicovoiceKey,
  updateSettings,
} from '../config/settingsStore.js'
import { updateProviderSecret } from '../db/providerRepository.js'
import { stateMachine } from '../state/stateMachine.js'
import { listOutputDevices } from '../audio/audioOutput.js'
import { speak } from '../audio/tts/textToSpeech.js'
import {
  probeAllAutomationPermissions,
  probeAutomationPermission,
  type AutomationTarget,
} from '../setup/automationPermission.js'
import {
  checkPrerequisites,
  checkAllPermissions,
  openAutomationPrefs,
  openMicrophonePrefs,
  openScreenRecordingPrefs,
  openSpeechRecognitionPrefs,
  checkAppleSpeechAvailability,
  requestAllPermissions,
  requestMicrophonePermission,
  requestScreenRecordingPermission,
  requestSpeechRecognitionPermission,
} from '../setup/bootstrap.js'
import { getModelsStatus, warmupAllModels } from '../models/modelManager.js'
import { hasAppSecret, hasProviderSecret } from '../db/providerRepository.js'
import { confirmToolPreview, listToolCatalog } from '../agent/toolRegistry.js'
import { runDiagnostics } from '../setup/diagnostics.js'
import {
  checkForUpdates,
  downloadUpdate,
  getUpdateStatus,
  installUpdate,
} from '../setup/autoUpdater.js'
import {
  getVoiceExtrasStatus,
  installVoiceExtra,
} from '../setup/voiceExtras.js'
import type { VoiceExtraId } from '../../shared/types.js'

let activeThreadId = 'general'

const STATE_LISTENER_KEY = Symbol.for('ambient-mac-copilot.stateListener')

function clearIpcHandlers(): void {
  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel)
  }
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  clearIpcHandlers()

  const root = globalThis as Record<symbol, (state: CopilotState) => void>
  const previousListener = root[STATE_LISTENER_KEY]
  if (previousListener) {
    stateMachine.off('stateChange', previousListener)
  }

  ipcMain.handle('agent:send-message', async (_, text: string) => {
    const result = await orchestrator.run(text, activeThreadId)
    return result
  })

  ipcMain.handle('agent:screen-analysis', async (_, query: string) => {
    return orchestrator.runScreenAnalysis(query, activeThreadId)
  })

  ipcMain.handle('context:list-threads', () => contextStore.listThreads())

  ipcMain.handle('context:create-thread', (_, title?: string) => {
    const thread = contextStore.createThread(title)
    activeThreadId = thread.id
    return thread
  })

  ipcMain.handle('context:switch-thread', (_, threadId: string) => {
    activeThreadId = threadId
  })

  ipcMain.handle('context:get-messages', (_, threadId: string) => {
    return contextStore.getMessages(threadId)
  })

  ipcMain.handle('context:delete-thread', (_, threadId: string) => {
    contextStore.deleteThread(threadId)
    if (activeThreadId === threadId) {
      activeThreadId = 'general'
    }
  })

  ipcMain.handle('settings:get', () => getSettings())

  ipcMain.handle('settings:update', (_, partial: Partial<AppSettings>) => {
    updateSettings(partial)
  })

  ipcMain.handle('settings:update-provider-secret', (_, providerId: string, apiKey: string) => {
    updateProviderSecret(providerId, apiKey)
  })

  ipcMain.handle('settings:update-picovoice-key', (_, key: string) => {
    updatePicovoiceKey(key)
  })

  ipcMain.handle('settings:test-provider', (_, providerId: string) => {
    return orchestrator.testProviderConnection(providerId)
  })

  ipcMain.handle('settings:test-agent', (_, agentId: AgentId) => {
    return orchestrator.testAgentConnection(agentId)
  })

  ipcMain.handle('audio:list-output-devices', () => listOutputDevices())

  ipcMain.handle('audio:test-tts', async (_, text?: string) => {
    try {
      await speak(text ?? 'Hola, soy tu copilot ambient.')
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('onboarding:get-status', async () => {
    const settings = getSettings()
    const prereqs = await checkPrerequisites()
    const perms = await checkAllPermissions()
    const models = getModelsStatus()

    const activationReady =
      settings.audio.activationMode === 'push-to-talk' ||
      settings.audio.activationMode === 'none' ||
      (settings.audio.activationMode === 'wake-word' &&
        hasAppSecret('picovoice') &&
        getVoiceExtrasStatus().picovoice.installed)

    return {
      completed: settings.onboardingCompleted ?? false,
      steps: {
        providers: hasProviderSecret('openrouter-main'),
        activation: activationReady,
        picovoice: hasAppSecret('picovoice'),
        permissions: perms.allGranted,
        blackhole: prereqs.blackhole.installed,
        ffmpeg: prereqs.ffmpeg.installed,
        models: true,
        kokoro: models.kokoro,
      },
    }
  })

  ipcMain.handle('setup:check-prerequisites', () => checkPrerequisites())

  ipcMain.handle('permissions:request-microphone', () => requestMicrophonePermission())

  ipcMain.handle('permissions:request-screen', () => requestScreenRecordingPermission())

  ipcMain.handle('permissions:request-all', () => requestAllPermissions())

  ipcMain.handle('permissions:check-apple-speech', () => checkAppleSpeechAvailability())

  ipcMain.handle('permissions:request-apple-speech', () => requestSpeechRecognitionPermission())

  ipcMain.handle('permissions:open-speech-prefs', () => {
    openSpeechRecognitionPrefs()
  })

  ipcMain.handle('permissions:check-all', () => checkAllPermissions())

  ipcMain.handle('models:get-status', () => getModelsStatus())

  ipcMain.handle('permissions:open-screen-prefs', () => {
    openScreenRecordingPrefs()
  })

  ipcMain.handle('permissions:open-microphone-prefs', () => {
    openMicrophonePrefs()
  })

  ipcMain.handle('permissions:open-automation-prefs', () => {
    openAutomationPrefs()
  })

  ipcMain.handle(
    'permissions:probe-automation',
    (_, target?: AutomationTarget) =>
      target ? probeAutomationPermission(target) : probeAllAutomationPermissions(),
  )

  ipcMain.handle('onboarding:complete', () => {
    completeOnboarding()
  })

  ipcMain.handle('models:warmup', async () => {
    const win = getWindow()
    return warmupAllModels((model, progress) => {
      win?.webContents.send('models:download-progress', { model, progress })
    })
  })

  ipcMain.handle('diagnostics:run', () => runDiagnostics())

  ipcMain.handle('tools:list', () => listToolCatalog())

  ipcMain.handle('tools:confirm-preview', async (_, previewId: string) => {
    const result = await confirmToolPreview(previewId)
    if (result.status === 'ok') {
      return { ok: true, reply: result.reply }
    }
    return { ok: false, reply: result.reply, error: result.status === 'error' ? result.error : 'unknown' }
  })

  ipcMain.handle('update:get-status', () => getUpdateStatus())
  ipcMain.handle('update:check', () => checkForUpdates(true))
  ipcMain.handle('update:download', () => downloadUpdate())
  ipcMain.handle('update:install', () => installUpdate())

  ipcMain.handle('voice-extras:status', () => getVoiceExtrasStatus())

  ipcMain.handle('voice-extras:install', async (_, id: VoiceExtraId) => {
    const win = getWindow()
    const result = await installVoiceExtra(id, (progress) => {
      win?.webContents.send('voice-extras:progress', { id, progress })
    })
    if (result.ok && id === 'kokoro') {
      const models = await import('../models/modelManager.js')
      await models.warmupAllModels((model, progress) => {
        win?.webContents.send('models:download-progress', { model, progress })
      })
    }
    return result
  })

  const onStateChange = (state: CopilotState) => {
    getWindow()?.webContents.send('state:change', state)
  }
  root[STATE_LISTENER_KEY] = onStateChange
  stateMachine.onStateChange(onStateChange)
}
