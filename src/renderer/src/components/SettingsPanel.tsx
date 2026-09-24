import { useCallback, useEffect, useState } from 'react'
import { Cloud, Bot, Volume2, Mic, Activity } from 'lucide-react'
import { DiagnosticsPanel } from './DiagnosticsPanel'
import { UpdatePanel } from './UpdatePanel'
import { SettingsLayout } from '@/components/kreo/ui/SettingsLayout'
import { ProviderListPanel } from './ProviderListPanel'
import { AgentBindingsPanel } from './AgentBindingsPanel'
import { InputText } from '@/components/kreo/ui/InputText'
import { Button } from '@/components/kreo/ui/Button'
import { useSettings } from '@/hooks/useSettings'
import {
  KOKORO_TTS_VOICES_EN_FALLBACK,
  KOKORO_TTS_VOICES_ES,
  MACOS_TTS_VOICES,
} from '@shared/ttsOptions'
import { VoiceExtrasCard } from './VoiceExtrasCard'
import { toast } from 'sonner'
import type { VoiceExtrasStatus } from '@shared/types'

const NAV = [
  { label: 'Proveedores', href: 'providers', icon: Cloud, description: 'Gateways LLM y claves API.' },
  { label: 'Agentes', href: 'agents', icon: Bot, description: 'Modelo y proveedor por agente interno.' },
  { label: 'Voz', href: 'voice', icon: Volume2, description: 'Reconocimiento y síntesis de voz.' },
  { label: 'Audio', href: 'audio', icon: Mic, description: 'Wake word, Picovoice y captura de reunión.' },
  { label: 'Sistema', href: 'system', icon: Activity, description: 'Diagnóstico de permisos y herramientas.' },
]

interface SettingsPanelProps {
  section?: string
  onSectionChange?: (section: string) => void
}

export function SettingsPanel({ section: controlledSection, onSectionChange }: SettingsPanelProps = {}) {
  const { settings, update, saving } = useSettings()
  const [internalSection, setInternalSection] = useState('providers')
  const section = controlledSection ?? internalSection
  const setSection = (next: string) => {
    onSectionChange?.(next)
    if (controlledSection === undefined) setInternalSection(next)
  }
  const [picovoiceKey, setPicovoiceKey] = useState('')
  const [voiceExtras, setVoiceExtras] = useState<VoiceExtrasStatus | null>(null)

  const refreshVoiceExtras = useCallback(async () => {
    setVoiceExtras(await window.electronAPI.getVoiceExtrasStatus())
  }, [])

  useEffect(() => {
    if (section === 'voice' || section === 'audio') {
      void refreshVoiceExtras()
    }
  }, [section, refreshVoiceExtras])

  if (!settings) {
    return <div className="p-4 text-sm text-[var(--foreground-muted)]">Cargando ajustes…</div>
  }

  const savePicovoice = async () => {
    if (!picovoiceKey.trim()) return
    await window.electronAPI.updatePicovoiceKey(picovoiceKey)
    setPicovoiceKey('')
    toast.success('Picovoice guardada')
  }

  const testTTS = async () => {
    const result = await window.electronAPI.testTTS(
      settings.tts.provider === 'kokoro'
        ? 'Hola, soy tu copilot. Esta es una prueba de Kokoro.'
        : 'Hola, soy tu copilot. Esta es una prueba con la voz del sistema.',
    )
    if (result.ok) toast.success('TTS reproducido')
    else toast.error(result.error ?? 'Error TTS')
  }

  const isKokoro = settings.tts.provider === 'kokoro'
  const activeNav = NAV.find((item) => item.href === section)

  return (
    <SettingsLayout
      navigationItems={NAV}
      activeHref={section}
      onNavigate={setSection}
      contentTitle={activeNav?.label}
      contentSubtitle={activeNav?.description}
      className="h-full min-h-0"
    >
      {section === 'providers' && (
        <ProviderListPanel settings={settings} onUpdate={update} />
      )}
      {section === 'agents' && (
        <AgentBindingsPanel settings={settings} onUpdate={update} />
      )}
      {section === 'voice' && (
        <div className="space-y-4">
          <div className="mac-form-field">
            <label className="mac-form-label">Reconocimiento (STT)</label>
            <select
              className="mac-form-select"
              value={settings.stt.provider}
              onChange={(e) =>
                update({
                  stt: { ...settings.stt, provider: e.target.value as typeof settings.stt.provider },
                })
              }
            >
              <option value="apple">Apple Speech (local, español)</option>
              <option value="cloud">Cloud (Whisper)</option>
              <option value="auto">Auto (Apple → Cloud)</option>
            </select>
          </div>

          <div className="mac-form-field">
            <label className="mac-form-label">Idioma STT</label>
            <select
              className="mac-form-select"
              value={settings.stt.language}
              onChange={(e) =>
                update({
                  stt: { ...settings.stt, language: e.target.value },
                })
              }
            >
              <option value="es">Español (es-MX)</option>
              <option value="en">English (en-US)</option>
            </select>
          </div>

          <div className="mac-form-field">
            <label className="mac-form-label">Síntesis (TTS)</label>
            <select
              className="mac-form-select"
              value={settings.tts.provider}
              onChange={(e) =>
                update({
                  tts: { ...settings.tts, provider: e.target.value as typeof settings.tts.provider },
                })
              }
            >
              <option value="macos">macOS say (Monica, español)</option>
              <option value="kokoro" disabled={!voiceExtras?.kokoro.installed}>
                Kokoro (local, ONNX){voiceExtras?.kokoro.installed ? '' : ' — instalar abajo'}
              </option>
            </select>
          </div>

          <VoiceExtrasCard ids={['kokoro']} onInstalled={refreshVoiceExtras} />

          {!isKokoro ? (
            <div className="mac-form-field">
              <label className="mac-form-label">Voz macOS</label>
              <select
                className="mac-form-select"
                value={settings.tts.macosVoice}
                onChange={(e) =>
                  update({ tts: { ...settings.tts, macosVoice: e.target.value } })
                }
              >
                {MACOS_TTS_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>{voice.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="mac-form-field">
                <label className="mac-form-label">Voz Kokoro</label>
                <select
                  className="mac-form-select"
                  value={settings.tts.kokoroVoice}
                  onChange={(e) =>
                    update({ tts: { ...settings.tts, kokoroVoice: e.target.value } })
                  }
                >
                  <optgroup label="Español (cuando kokoro-js lo soporte)">
                    {KOKORO_TTS_VOICES_ES.map((voice) => (
                      <option key={voice.id} value={voice.id}>{voice.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Inglés (disponible hoy en npm)">
                    {KOKORO_TTS_VOICES_EN_FALLBACK.map((voice) => (
                      <option key={voice.id} value={voice.id}>{voice.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                Kokoro 1.2.x en npm aún solo incluye voces en inglés; si eliges una voz española,
                la app usará la mejor voz disponible hasta que se publique el pack multilingüe.
              </p>
              <InputText
                fullWidth
                label="Velocidad Kokoro"
                type="number"
                value={String(settings.tts.speed)}
                onChange={(e) =>
                  update({ tts: { ...settings.tts, speed: Number(e.target.value) || 1 } })
                }
              />
            </>
          )}

          <Button onClick={testTTS}>Probar TTS</Button>
        </div>
      )}
      {section === 'system' && (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-sm font-medium text-[var(--foreground)]">Actualizaciones</h3>
            <UpdatePanel />
          </section>
          <section>
            <h3 className="mb-3 text-sm font-medium text-[var(--foreground)]">Diagnóstico</h3>
            <DiagnosticsPanel />
          </section>
        </div>
      )}
      {section === 'audio' && (
        <div className="space-y-4">
          <div className="mac-form-field">
            <label className="mac-form-label">Modo de activación</label>
            <select
              className="mac-form-select"
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
              <option value="push-to-talk">Push-to-talk (⌘⇧V)</option>
              <option value="wake-word">Wake word (Picovoice)</option>
              <option value="none">Solo chat / atajos</option>
            </select>
          </div>

          {settings.audio.activationMode === 'wake-word' && (
            <>
              <VoiceExtrasCard ids={['picovoice']} onInstalled={refreshVoiceExtras} />
              <InputText
                fullWidth
                label="Wake word"
                value={settings.audio.wakeWord}
                onChange={(e) =>
                  update({ audio: { ...settings.audio, wakeWord: e.target.value } })
                }
              />
            </>
          )}
          <InputText
            fullWidth
            label="Ruta de ffmpeg"
            value={settings.audio.ffmpegPath}
            onChange={(e) =>
              update({ audio: { ...settings.audio, ffmpegPath: e.target.value } })
            }
          />
          <div className="space-y-2">
            <InputText
              fullWidth
              label="Picovoice Access Key"
              type="password"
              value={picovoiceKey}
              onChange={(e) => setPicovoiceKey(e.target.value)}
              placeholder={settings.audio.picovoiceAccessKeyMasked ? '•••••••• (ya configurada)' : ''}
            />
            <p className="text-xs text-[var(--foreground-muted)]">
              La clave de Picovoice se guarda por separado (cifrada). El resto de campos se guardan al cambiar.
            </p>
            <Button onClick={savePicovoice} disabled={saving || !picovoiceKey.trim()}>
              Guardar Picovoice
            </Button>
          </div>
        </div>
      )}
    </SettingsLayout>
  )
}
