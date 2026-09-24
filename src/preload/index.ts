import { contextBridge, ipcRenderer } from 'electron'
import type {
  AgentId,
  AppSettings,
  ChatMessage,
  ChatThread,
  CopilotState,
  UpdateStatus,
} from '../shared/types.js'

const electronAPI = {
  sendUserMessage: (text: string) => ipcRenderer.invoke('agent:send-message', text),
  requestScreenAnalysis: (query: string) => ipcRenderer.invoke('agent:screen-analysis', query),
  onStateChange: (cb: (state: CopilotState) => void) => {
    const handler = (_: unknown, state: CopilotState) => cb(state)
    ipcRenderer.on('state:change', handler)
    return () => ipcRenderer.removeListener('state:change', handler)
  },
  onMeetingStatusUpdate: (cb: (data: { status: string; duration?: number }) => void) => {
    const handler = (_: unknown, data: { status: string; duration?: number }) => cb(data)
    ipcRenderer.on('meeting:status', handler)
    return () => ipcRenderer.removeListener('meeting:status', handler)
  },
  listThreads: (): Promise<ChatThread[]> => ipcRenderer.invoke('context:list-threads'),
  createThread: (title?: string): Promise<ChatThread> =>
    ipcRenderer.invoke('context:create-thread', title),
  switchThread: (threadId: string) => ipcRenderer.invoke('context:switch-thread', threadId),
  getMessages: (threadId: string): Promise<ChatMessage[]> =>
    ipcRenderer.invoke('context:get-messages', threadId),
  deleteThread: (threadId: string) => ipcRenderer.invoke('context:delete-thread', threadId),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', partial),
  onSettingsSync: (cb: (settings: AppSettings) => void) => {
    const handler = (_: unknown, settings: AppSettings) => cb(settings)
    ipcRenderer.on('settings:sync', handler)
    return () => ipcRenderer.removeListener('settings:sync', handler)
  },
  updateProviderSecret: (providerId: string, apiKey: string) =>
    ipcRenderer.invoke('settings:update-provider-secret', providerId, apiKey),
  updatePicovoiceKey: (key: string) => ipcRenderer.invoke('settings:update-picovoice-key', key),
  testProviderConnection: (providerId: string) =>
    ipcRenderer.invoke('settings:test-provider', providerId),
  testAgent: (agentId: AgentId) => ipcRenderer.invoke('settings:test-agent', agentId),
  listAudioOutputDevices: () => ipcRenderer.invoke('audio:list-output-devices'),
  testTTS: (text?: string) => ipcRenderer.invoke('audio:test-tts', text),
  getOnboardingStatus: () => ipcRenderer.invoke('onboarding:get-status'),
  completeOnboarding: () => ipcRenderer.invoke('onboarding:complete'),
  checkPermissions: () => ipcRenderer.invoke('permissions:check-all'),
  requestMicrophonePermission: () => ipcRenderer.invoke('permissions:request-microphone'),
  requestScreenRecordingPermission: () => ipcRenderer.invoke('permissions:request-screen'),
  requestAllPermissions: () => ipcRenderer.invoke('permissions:request-all'),
  getModelsStatus: () => ipcRenderer.invoke('models:get-status'),
  openScreenRecordingPrefs: () => ipcRenderer.invoke('permissions:open-screen-prefs'),
  openMicrophonePrefs: () => ipcRenderer.invoke('permissions:open-microphone-prefs'),
  openAutomationPrefs: () => ipcRenderer.invoke('permissions:open-automation-prefs'),
  probeAutomationPermission: (target?: 'mail' | 'notes' | 'reminders') =>
    ipcRenderer.invoke('permissions:probe-automation', target),
  checkAppleSpeech: () => ipcRenderer.invoke('permissions:check-apple-speech'),
  requestAppleSpeech: () => ipcRenderer.invoke('permissions:request-apple-speech'),
  openSpeechRecognitionPrefs: () => ipcRenderer.invoke('permissions:open-speech-prefs'),
  checkPrerequisites: () => ipcRenderer.invoke('setup:check-prerequisites'),
  onModelDownloadProgress: (cb: (data: { model: string; progress: number }) => void) => {
    const handler = (_: unknown, data: { model: string; progress: number }) => cb(data)
    ipcRenderer.on('models:download-progress', handler)
    return () => ipcRenderer.removeListener('models:download-progress', handler)
  },
  toggleWindow: async () => {
    /* handled via global shortcut in main */
  },
  openSettings: async () => {
    ipcRenderer.send('ui:open-settings')
  },
  onOpenSettings: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('ui:open-settings', handler)
    return () => ipcRenderer.removeListener('ui:open-settings', handler)
  },
  onOpenOnboarding: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('ui:open-onboarding', handler)
    return () => ipcRenderer.removeListener('ui:open-onboarding', handler)
  },
  warmupModels: () => ipcRenderer.invoke('models:warmup'),
  runDiagnostics: () => ipcRenderer.invoke('diagnostics:run'),
  listTools: () => ipcRenderer.invoke('tools:list'),
  confirmToolPreview: (previewId: string) => ipcRenderer.invoke('tools:confirm-preview', previewId),
  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:get-status'),
  checkForUpdates: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:check'),
  downloadUpdate: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:download'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (cb: (status: UpdateStatus) => void) => {
    const handler = (_: unknown, status: UpdateStatus) => cb(status)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
