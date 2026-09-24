import { getPicovoiceKey, getSettings, onSettingsChanged } from '../../config/settingsStore.js'
import { stateMachine } from '../../state/stateMachine.js'
import { createActivationProvider } from './createActivationProvider.js'
import type { CommandActivationProvider } from './types.js'

class CommandActivationManager {
  private onActivate: (() => void) | null = null
  private provider: CommandActivationProvider | null = null
  private enabled = false

  init(onActivate: () => void): void {
    this.onActivate = onActivate
    onSettingsChanged(() => {
      if (this.enabled && stateMachine.getState() === 'FOCUS_IDLE') {
        this.restart()
      }
    })
  }

  async start(): Promise<void> {
    this.enabled = true
    await this.restart()
  }

  pause(): void {
    this.provider?.stop()
    this.provider = null
  }

  async resume(): Promise<void> {
    if (this.enabled && stateMachine.getState() === 'FOCUS_IDLE') {
      await this.restart()
    }
  }

  stop(): void {
    this.enabled = false
    this.provider?.stop()
    this.provider = null
  }

  private async restart(): Promise<void> {
    this.provider?.stop()
    this.provider = null

    const { activationMode } = getSettings().audio

    if (activationMode === 'none') {
      console.log('[activation] Disabled')
      return
    }

    if (activationMode === 'wake-word' && !getPicovoiceKey()) {
      console.warn('[activation] wake-word mode requires Picovoice key')
      return
    }

    const provider = createActivationProvider(activationMode)
    this.provider = provider
    await provider.start(() => this.onActivate?.())
  }
}

export const commandActivation = new CommandActivationManager()
