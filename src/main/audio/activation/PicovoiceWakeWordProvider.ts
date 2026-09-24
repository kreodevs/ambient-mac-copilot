import { getPicovoiceKey, getSettings } from '../../config/settingsStore.js'
import { stateMachine } from '../../state/stateMachine.js'
import type { CommandActivationProvider } from './types.js'

export class PicovoiceWakeWordProvider implements CommandActivationProvider {
  readonly mode = 'wake-word' as const
  private listening = false
  private onActivate: (() => void) | null = null
  private recorder: { stop: () => void } | null = null
  private porcupine: { release: () => void } | null = null

  async start(onActivate: () => void): Promise<void> {
    if (this.listening) return
    this.onActivate = onActivate

    const key = getPicovoiceKey()
    if (!key) {
      console.warn('[activation:wake-word] No Picovoice key configured')
      return
    }

    try {
      const { Porcupine } = await import('@picovoice/porcupine-node')
      const { PvRecorder } = await import('@picovoice/pvrecorder-node')
      const settings = getSettings()

      const porcupine = new Porcupine(key, [settings.audio.wakeWord])
      const recorder = new PvRecorder(porcupine.frameLength, -1)
      recorder.start()

      this.porcupine = porcupine
      this.recorder = recorder
      this.listening = true

      console.log(`[activation:wake-word] Listening for "${settings.audio.wakeWord}"`)

      const poll = () => {
        if (!this.listening || stateMachine.getState() !== 'FOCUS_IDLE') {
          setTimeout(poll, 500)
          return
        }

        try {
          const frame = recorder.read()
          const index = porcupine.process(frame)
          if (index >= 0) {
            this.onActivate?.()
          }
        } catch {
          // recorder may be busy
        }
        setImmediate(poll)
      }

      poll()
    } catch (err) {
      console.warn('[activation:wake-word] Porcupine init failed:', err)
      this.cleanup()
    }
  }

  stop(): void {
    this.listening = false
    this.onActivate = null
    this.cleanup()
  }

  private cleanup(): void {
    try {
      this.recorder?.stop()
    } catch {
      // ignore
    }
    try {
      this.porcupine?.release()
    } catch {
      // ignore
    }
    this.recorder = null
    this.porcupine = null
  }
}
