import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { GlassShell } from '@/components/kreo/GlassShell'
import { Button } from '@/components/kreo/ui/Button'
import { StatusPill } from '@/components/kreo/ui/StatusPill'
import { InputText } from '@/components/kreo/ui/InputText'
import { useSettings } from '@/hooks/useSettings'
import { toast } from 'sonner'

const STEPS = [
  'Proveedores',
  'Activación',
  'Permisos',
  'Automatización',
  'BlackHole',
  'Modelos',
  'Listo',
]

interface SetupSteps {
  providers: boolean
  activation: boolean
  picovoice: boolean
  permissions: boolean
  blackhole: boolean
  ffmpeg: boolean
  models: boolean
}

interface OnboardingWizardProps {
  onComplete: () => void
}

type AutomationProbe = Extract<
  Awaited<ReturnType<typeof window.electronAPI.probeAutomationPermission>>,
  { target: string }
>

const AUTOMATION_STATUS_KEY = 'ambient-mac-copilot.automation-status'

function loadAutomationStatus(): AutomationProbe[] | null {
  try {
    const raw = localStorage.getItem(AUTOMATION_STATUS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AutomationProbe[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveAutomationStatus(results: AutomationProbe[]): void {
  localStorage.setItem(AUTOMATION_STATUS_KEY, JSON.stringify(results))
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [permissions, setPermissions] = useState<Awaited<
    ReturnType<typeof window.electronAPI.checkPermissions>
  > | null>(null)
  const [setupSteps, setSetupSteps] = useState<SetupSteps | null>(null)
  const [modelProgress, setModelProgress] = useState<Record<string, number>>({})
  const [picovoiceKey, setPicovoiceKey] = useState('')
  const [testingProvider, setTestingProvider] = useState(false)
  const [automationStatus, setAutomationStatus] = useState<AutomationProbe[] | null>(
    () => loadAutomationStatus(),
  )
  const [automationProbing, setAutomationProbing] = useState(false)
  const { settings, update } = useSettings()

  const automationAllGranted = automationStatus?.every((r) => r.ok) ?? false

  const refreshStatus = useCallback(async () => {
    const [perms, status] = await Promise.all([
      window.electronAPI.checkPermissions(),
      window.electronAPI.getOnboardingStatus(),
    ])
    setPermissions(perms)
    setSetupSteps(status.steps as unknown as SetupSteps)
  }, [])

  useEffect(() => {
    refreshStatus()
    return window.electronAPI.onModelDownloadProgress(({ model, progress }) => {
      setModelProgress((prev) => ({ ...prev, [model]: progress }))
      if (progress >= 1) refreshStatus()
    })
  }, [refreshStatus])

  useEffect(() => {
    if (step === 2) {
      window.electronAPI.requestAllPermissions().then(() => refreshStatus())
    }
  }, [step, refreshStatus])

  const testOpenRouter = async () => {
    setTestingProvider(true)
    try {
      const result = await window.electronAPI.testProviderConnection('openrouter-main')
      if (result.ok) {
        toast.success('OpenRouter conectado correctamente')
        await refreshStatus()
      } else {
        toast.error(result.error ?? 'Error de conexión')
      }
    } finally {
      setTestingProvider(false)
    }
  }

  const savePicovoice = async () => {
    if (!picovoiceKey.trim()) return
    await window.electronAPI.updatePicovoiceKey(picovoiceKey.trim())
    setPicovoiceKey('')
    toast.success('Picovoice key guardada (cifrada)')
    await refreshStatus()
  }

  const requestMic = async () => {
    const result = await window.electronAPI.requestMicrophonePermission()
    await refreshStatus()
    if (result.granted) toast.success('Micrófono autorizado')
    else toast.message('Abre Preferencias del Sistema → Micrófono y activa Electron')
  }

  const requestScreen = async () => {
    const result = await window.electronAPI.requestScreenRecordingPermission()
    await refreshStatus()
    if (result.granted) toast.success('Screen Recording autorizado')
    else toast.message('Activa Electron en Preferencias → Grabación de pantalla')
  }

  const requestSpeech = async () => {
    const result = await window.electronAPI.requestAppleSpeech()
    await refreshStatus()
    if (result.granted) toast.success('Reconocimiento de voz autorizado')
    else if (result.status === 'misconfigured') {
      toast.error(result.reason ?? 'Falta NSSpeechRecognitionUsageDescription — ejecuta npm install y reinicia')
    } else {
      toast.message(
        result.reason ??
          'Activa Electron en Ajustes → Privacidad y seguridad → Reconocimiento de voz',
      )
    }
  }

  const requestAllPerms = async () => {
    const result = await window.electronAPI.requestAllPermissions()
    await refreshStatus()
    if (result.allGranted) toast.success('Permisos concedidos')
    else toast.message('Revisa Preferencias del Sistema (micrófono, pantalla y reconocimiento de voz)')
  }

  const refreshAutomationStatus = useCallback(async (notify = false) => {
    setAutomationProbing(true)
    try {
      const results = await window.electronAPI.probeAutomationPermission()
      const list = (Array.isArray(results) ? results : [results]) as AutomationProbe[]
      setAutomationStatus(list)
      saveAutomationStatus(list)
      const ok = list.filter((r) => r.ok).length
      if (notify) {
        if (ok === list.length) toast.success('Automatización autorizada')
        else toast.message(`${ok}/${list.length} autorizados — revisa Preferencias si denegaste alguno`)
      }
      return list
    } finally {
      setAutomationProbing(false)
    }
  }, [])

  const requestAutomation = async () => {
    if (automationAllGranted) return
    toast.message('Acepta los diálogos de macOS para Mail, Notes y Reminders…')
    await refreshAutomationStatus(true)
  }

  const warmupModels = async () => {
    toast.message('Descargando modelos… puede tardar varios minutos')
    const result = await window.electronAPI.warmupModels()
    await refreshStatus()
    if (result.ok) {
      toast.success('Kokoro listo')
    } else if (result.kokoro) {
      toast.warning(result.error ?? 'Kokoro parcial; se usará macOS say como fallback')
    } else {
      toast.error(result.error ?? 'Error descargando Kokoro')
    }
  }

  const finish = async () => {
    await window.electronAPI.completeOnboarding()
    onComplete()
  }

  const skip = async () => {
    await window.electronAPI.completeOnboarding()
    onComplete()
  }

  if (!settings || !setupSteps) {
    return (
      <div className="liquid-glass-overlay fixed inset-0 z-50 flex items-center justify-center">
        <p className="text-sm text-[var(--foreground-muted)]">Cargando asistente…</p>
      </div>
    )
  }

  return (
    <div className="liquid-glass-overlay app-window-drag fixed inset-0 z-50 flex items-center justify-center p-4">
      <GlassShell className="app-window-no-drag h-[90%] w-full max-w-lg">
        <div className="liquid-glass-divider app-window-drag flex cursor-grab items-center justify-between border-b px-4 py-3 active:cursor-grabbing">
          <h2 className="text-sm font-medium">Setup Assistant</h2>
          <div className="app-window-no-drag flex items-center gap-2">
            <StatusPill status="info">{`Paso ${step + 1}/${STEPS.length}`}</StatusPill>
            <button
              type="button"
              onClick={skip}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              aria-label="Omitir configuración"
              title="Omitir por ahora"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="app-window-no-drag flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm">
                <strong>1. Proveedores LLM</strong> — OpenRouter para chat y Jev.
              </p>
              <div className="liquid-glass-subtle flex items-center justify-between rounded-[var(--radius-md)] p-3">
                <div>
                  <p className="text-sm font-medium">OpenRouter</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {setupSteps.providers
                      ? 'API key configurada (cifrada en SQLite)'
                      : 'Falta API key — define OPENROUTER_API_KEY y reinicia'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={setupSteps.providers ? 'success' : 'warning'}>
                    {setupSteps.providers ? 'OK' : 'Pendiente'}
                  </StatusPill>
                  <Button variant="ghost" onClick={testOpenRouter} disabled={testingProvider || !setupSteps.providers}>
                    Test
                  </Button>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                9router local opcional en Ajustes → Proveedores (`http://localhost:20128/v1`).
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                <strong>2. Activación</strong> — elige cómo invocar comandos de voz.
              </p>
              <label className="block text-xs text-[var(--text-muted)]">Modo</label>
              <select
                className="liquid-glass-input w-full rounded-[var(--radius-md)] border px-3 py-2 text-sm"
                value={settings.audio.activationMode}
                onChange={(e) =>
                  update({
                    audio: {
                      ...settings.audio,
                      activationMode: e.target.value as typeof settings.audio.activationMode,
                    },
                  })
                }
              >
                <option value="push-to-talk">Push-to-talk (recomendado, sin API key)</option>
                <option value="wake-word">Wake word con Picovoice</option>
              </select>

              {settings.audio.activationMode === 'push-to-talk' && (
                <p className="text-xs text-[var(--text-muted)]">
                  Usa <kbd className="rounded bg-white/10 px-1">⌘⇧V</kbd> para grabar un comando.
                  Puedes cambiar el atajo en Ajustes → Audio.
                </p>
              )}

              {settings.audio.activationMode === 'wake-word' && (
                <>
                  <InputText
                    label="Wake word"
                    value={settings.audio.wakeWord}
                    onChange={(e) =>
                      update({ audio: { ...settings.audio, wakeWord: e.target.value } })
                    }
                  />
                  <InputText
                    label="Picovoice Access Key"
                    type="password"
                    value={picovoiceKey}
                    onChange={(e) => setPicovoiceKey(e.target.value)}
                    placeholder={setupSteps.picovoice ? '•••••••• (ya configurada)' : ''}
                  />
                  <Button onClick={savePicovoice} disabled={!picovoiceKey.trim()}>Guardar key</Button>
                  <p className="text-xs text-[var(--text-muted)]">
                    Access Key gratuita en{' '}
                    <button
                      type="button"
                      className="text-[var(--accent)] underline"
                      onClick={() => window.open('https://console.picovoice.ai/')}
                    >
                      console.picovoice.ai
                    </button>
                  </p>
                </>
              )}

              {setupSteps.activation && (
                <p className="text-xs text-[var(--success)]">✓ Activación configurada</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                <strong>3. Permisos</strong> — micrófono, reconocimiento de voz (Apple Speech) y pantalla.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                En desarrollo, activa <strong>Electron</strong> en Preferencias del Sistema.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Micrófono</span>
                <div className="flex items-center gap-2">
                  <StatusPill status={permissions?.microphoneGranted ? 'success' : 'warning'}>
                    {permissions?.microphone ?? 'unknown'}
                  </StatusPill>
                  <Button variant="ghost" onClick={requestMic}>Solicitar</Button>
                  <Button variant="ghost" onClick={() => window.electronAPI.openMicrophonePrefs()}>
                    Preferencias
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Screen Recording</span>
                <div className="flex items-center gap-2">
                  <StatusPill status={permissions?.screenGranted ? 'success' : 'warning'}>
                    {permissions?.screen ?? 'unknown'}
                  </StatusPill>
                  <Button variant="ghost" onClick={requestScreen}>Solicitar</Button>
                  <Button variant="ghost" onClick={() => window.electronAPI.openScreenRecordingPrefs()}>
                    Preferencias
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Reconocimiento de voz</span>
                <div className="flex items-center gap-2">
                  <StatusPill status={permissions?.speechGranted ? 'success' : 'warning'}>
                    {permissions?.speech ?? 'unknown'}
                  </StatusPill>
                  <Button variant="ghost" onClick={requestSpeech}>Solicitar</Button>
                  <Button variant="ghost" onClick={() => window.electronAPI.openSpeechRecognitionPrefs()}>
                    Preferencias
                  </Button>
                </div>
              </div>
              <Button onClick={requestAllPerms}>Solicitar todos</Button>
              <Button variant="ghost" onClick={refreshStatus}>Actualizar estado</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-muted)]">
                <strong>4. Automatización</strong> — macOS solo muestra la app en Ajustes{' '}
                <em>después</em> de que intente controlar Mail, Notes o Reminders.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                En desarrollo aparece como <strong>Electron</strong>, no como Ambient Mac Copilot.
              </p>

              {automationAllGranted ? (
                <div className="liquid-glass-subtle rounded-[var(--radius-md)] p-3">
                  <p className="text-sm font-medium text-[var(--success)]">
                    Permisos de automatización autorizados
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Mail, Notes y Reminders listos para el copilot.
                  </p>
                </div>
              ) : null}

              {automationStatus?.map((item) => (
                <div key={item.target} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <StatusPill status={item.ok ? 'success' : 'warning'}>
                    {item.ok ? 'autorizado' : 'pendiente'}
                  </StatusPill>
                </div>
              ))}

              <Button
                onClick={requestAutomation}
                disabled={automationProbing || automationAllGranted}
              >
                {automationAllGranted
                  ? 'Permisos autorizados'
                  : 'Solicitar permisos (Mail, Notes, Reminders)'}
              </Button>
              <Button variant="ghost" onClick={() => window.electronAPI.openAutomationPrefs()}>
                Abrir Preferencias de Automatización
              </Button>
              {!automationAllGranted && (
                <Button
                  variant="ghost"
                  disabled={automationProbing}
                  onClick={() => refreshAutomationStatus(true)}
                >
                  Actualizar estado
                </Button>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 text-sm">
              <p><strong>5. BlackHole + ffmpeg</strong> — audio estéreo en reuniones.</p>
              <div className="flex items-center justify-between">
                <span>ffmpeg</span>
                <StatusPill status={setupSteps.ffmpeg ? 'success' : 'warning'}>
                  {setupSteps.ffmpeg ? 'OK' : 'No'}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span>BlackHole 2ch</span>
                <StatusPill status={setupSteps.blackhole ? 'success' : 'warning'}>
                  {setupSteps.blackhole ? 'OK' : 'No'}
                </StatusPill>
              </div>
              {!setupSteps.blackhole && (
                <p className="text-xs text-[var(--text-muted)]">
                  Instala con: <code>brew install --cask blackhole-2ch</code>
                  <br />
                  Luego crea Multi-Output Device en Audio MIDI Setup (Mic + BlackHole).
                </p>
              )}
              <Button variant="ghost" onClick={refreshStatus}>Verificar de nuevo</Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <p className="text-sm"><strong>6. Modelo local</strong> — Kokoro TTS (STT vía Apple Speech, sin descarga).</p>
              {['kokoro'].map((model) => (
                <div key={model}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{model}</span>
                    <span>{Math.round((modelProgress[model] ?? 0) * 100)}%</span>
                  </div>
                  <div className="liquid-glass-subtle h-1.5 rounded-full">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${(modelProgress[model] ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <Button onClick={warmupModels}>Descargar modelos</Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 text-center text-sm">
              <p className="text-lg">¡Listo!</p>
              <div className="space-y-1 text-left text-xs text-[var(--text-muted)]">
                <p>{setupSteps.providers ? '✓' : '○'} OpenRouter</p>
                <p>{setupSteps.activation ? '✓' : '○'} Activación de voz</p>
                <p>{setupSteps.permissions ? '✓' : '○'} Permisos</p>
                <p>{setupSteps.models ? '✓' : '○'} Modelos locales</p>
                <p>{setupSteps.blackhole ? '✓' : '○'} BlackHole</p>
                <p>{setupSteps.ffmpeg ? '✓' : '○'} ffmpeg</p>
              </div>
              <p className="text-[var(--text-muted)]">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5">⌘⇧Space</kbd> abre el copilot.
                {settings.audio.activationMode === 'push-to-talk' && (
                  <> <kbd className="rounded bg-white/10 px-1.5 py-0.5">⌘⇧V</kbd> activa un comando.</>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="app-window-no-drag flex justify-between border-t border-[var(--border-subtle)] px-4 py-3">
          <div className="flex gap-2">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              Atrás
            </Button>
            <Button variant="ghost" onClick={skip}>Omitir</Button>
          </div>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Siguiente</Button>
          ) : (
            <Button onClick={finish}>Empezar</Button>
          )}
        </div>
      </GlassShell>
    </div>
  )
}
