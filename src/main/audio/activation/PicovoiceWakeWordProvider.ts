import { getPicovoiceKey, getSettings } from '../../config/settingsStore.js'
import {
  importPorcupine,
  importPvRecorder,
  isVoiceExtraInstalled,
} from '../../setup/voiceExtras.js'
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
    if (!isVoiceExtraInstalled('picovoice')) {
      console.warn('[activation:wake-word] Picovoice runtime not installed')
      return
    }

    try {
      const { Porcupine } = await importPorcupine()
      const { PvRecorder } = await importPvRecorder()
      const settings = getSettings()

      const porcupine = new (Porcupine as new (accessKey: string, keywords: string[]) => {
        frameLength: number
        process: (frame: Int16Array) => number
        release: () => void
      })(key, [settings.audio.wakeWord])
      const recorder = new (PvRecorder as new (frameLength: number, deviceIndex: number) => {
        start: () => void
        stop: () => void
        read: () => Int16Array
      })(porcupine.frameLength, -1)
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
