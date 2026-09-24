export type ProviderPreset = 'openrouter' | '9router' | 'custom'

export interface ProviderProfile {
  id: string
  name: string
  preset: ProviderPreset
  baseUrl: string
  supportsSystemOne: boolean
  apiKeyMasked?: boolean
}

export type AgentId =
  | 'orchestrator'
  | 'jev'
  | 'screenVision'
  | 'meetingSummarizer'
  | 'cloudStt'

export interface AgentModelBinding {
  providerId: string
  model: string
  enabled: boolean
}

export type ActivationMode = 'push-to-talk' | 'wake-word' | 'none'

export interface AppSettings {
  providers: ProviderProfile[]
  agents: Record<AgentId, AgentModelBinding>
  jev: { minConfidence: number }
  stt: {
    provider: 'apple' | 'cloud' | 'auto'
    language: string
  }
  tts: {
    provider: 'macos' | 'kokoro'
    macosVoice: string
    kokoroVoice: string
    speed: number
    dtype: 'q8' | 'fp32'
    outputDeviceId: string | 'default' | 'headphones-preferred'
  }
  audio: {
    activationMode: ActivationMode
    pushToTalkShortcut: string
    wakeWord: string
    blackholeDeviceIndex: number
    ffmpegPath: string
    picovoiceAccessKeyMasked?: boolean
  }
  onboardingCompleted?: boolean
  /** Si true, la ventana no se oculta al perder el foco. */
  windowPinned?: boolean
}

export interface ChatThread {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface ChatMessage {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  actionData?: unknown
  createdAt: number
}

export interface AudioDevice {
  id: string
  name: string
  portType?: string
}

export type CopilotState =
  | 'INITIALIZING'
  | 'FOCUS_IDLE'
  | 'COMMAND_ACTIVE'
  | 'MEETING_MODE'
  | 'POST_PROCESSING'

export interface DiagnosticCheck {
  id: string
  label: string
  ok: boolean
  detail?: string
  fixHint?: string
}

export interface DiagnosticsReport {
  ok: boolean
  checks: DiagnosticCheck[]
  version: string
  ranAt: number
}

export interface ToolPreviewPayload {
  tool: string
  summary: string
  args: Record<string, unknown>
  risks: string[]
  expiresAt: number
}

export interface ToolCatalogEntry {
  name: string
  description: string
  phase: number
  risks: string[]
  requiresConfirmation: boolean
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export type VoiceExtraId = 'kokoro' | 'picovoice'

export interface VoiceExtraStatus {
  installed: boolean
  installing: boolean
  sizeHintMb: number
}

export interface VoiceExtrasStatus {
  kokoro: VoiceExtraStatus
  picovoice: VoiceExtraStatus
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string; releaseNotes?: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent?: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export interface ElectronAPI {
  sendUserMessage(text: string): Promise<{ reply: string; actionData?: unknown }>
  requestScreenAnalysis(query: string): Promise<{ analysis: string }>
  onStateChange(cb: (state: CopilotState) => void): () => void
  onMeetingStatusUpdate(cb: (data: { status: string; duration?: number }) => void): () => void
  listThreads(): Promise<ChatThread[]>
  createThread(title?: string): Promise<ChatThread>
  switchThread(threadId: string): Promise<void>
  getMessages(threadId: string): Promise<ChatMessage[]>
  deleteThread(threadId: string): Promise<void>
  getSettings(): Promise<AppSettings>
  updateSettings(partial: Partial<AppSettings>): Promise<void>
  onSettingsSync(cb: (settings: AppSettings) => void): () => void
  updateProviderSecret(providerId: string, apiKey: string): Promise<void>
  updatePicovoiceKey(key: string): Promise<void>
  testProviderConnection(providerId: string): Promise<{ ok: boolean; supportsSystemOne?: boolean; error?: string }>
  testAgent(agentId: AgentId): Promise<{ ok: boolean; error?: string }>
  listAudioOutputDevices(): Promise<AudioDevice[]>
  testTTS(text?: string): Promise<{ ok: boolean; error?: string }>
  getOnboardingStatus(): Promise<{ completed: boolean; steps: Record<string, boolean> }>
  completeOnboarding(): Promise<void>
  checkPermissions(): Promise<{
    microphone: string
    screen: string
    speech: string
    microphoneGranted: boolean
    screenGranted: boolean
    speechGranted: boolean
    allGranted: boolean
  }>
  requestMicrophonePermission(): Promise<{ status: string; granted: boolean }>
  requestScreenRecordingPermission(): Promise<{ status: string; granted: boolean }>
  requestAllPermissions(): Promise<{
    microphone: { status: string; granted: boolean }
    screen: { status: string; granted: boolean }
    speech: { status: string; granted: boolean; reason?: string }
    allGranted: boolean
  }>
  getModelsStatus(): Promise<{
    kokoro: boolean
    allReady: boolean
  }>
  openScreenRecordingPrefs(): Promise<void>
  openMicrophonePrefs(): Promise<void>
  openAutomationPrefs(): Promise<void>
  probeAutomationPermission(target?: 'mail' | 'notes' | 'reminders'): Promise<
    | { target: 'mail' | 'notes' | 'reminders'; label: string; ok: boolean; error?: string }
    | Array<{ target: 'mail' | 'notes' | 'reminders'; label: string; ok: boolean; error?: string }>
  >
  checkAppleSpeech(): Promise<{ available: boolean; reason?: string }>
  requestAppleSpeech(): Promise<{ granted: boolean; status: string; reason?: string }>
  openSpeechRecognitionPrefs(): Promise<void>
  checkPrerequisites(): Promise<{
    ffmpeg: { installed: boolean; path: string }
    blackhole: { installed: boolean }
  }>
  onModelDownloadProgress(cb: (data: { model: string; progress: number }) => void): () => void
  toggleWindow(): Promise<void>
  openSettings(): Promise<void>
  onOpenSettings(cb: () => void): () => void
  onOpenOnboarding(cb: () => void): () => void
  warmupModels(): Promise<{
    ok: boolean
    error?: string
    kokoro?: boolean
  }>
  runDiagnostics(): Promise<DiagnosticsReport>
  listTools(): Promise<ToolCatalogEntry[]>
  confirmToolPreview(previewId: string): Promise<{ ok: boolean; reply: string; error?: string }>
  getUpdateStatus(): Promise<UpdateStatus>
  checkForUpdates(): Promise<UpdateStatus>
  downloadUpdate(): Promise<UpdateStatus>
  installUpdate(): Promise<void>
  onUpdateStatus(cb: (status: UpdateStatus) => void): () => void
  getVoiceExtrasStatus(): Promise<VoiceExtrasStatus>
  installVoiceExtra(id: VoiceExtraId): Promise<{ ok: boolean; error?: string }>
  onVoiceExtraProgress(cb: (data: { id: VoiceExtraId; progress: number }) => void): () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
