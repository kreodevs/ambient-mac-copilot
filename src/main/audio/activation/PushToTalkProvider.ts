import { globalShortcut } from 'electron'
import { getSettings } from '../../config/settingsStore.js'
import type { CommandActivationProvider } from './types.js'

export class PushToTalkProvider implements CommandActivationProvider {
  readonly mode = 'push-to-talk' as const
  private shortcut = ''
  private onActivate: (() => void) | null = null

  async start(onActivate: () => void): Promise<void> {
    this.onActivate = onActivate
    this.shortcut = getSettings().audio.pushToTalkShortcut

    const registered = globalShortcut.register(this.shortcut, () => {
      this.onActivate?.()
    })

    if (!registered) {
      console.warn(`[activation:push-to-talk] Failed to register shortcut: ${this.shortcut}`)
    } else {
      console.log(`[activation:push-to-talk] Listening on ${this.shortcut}`)
    }
  }

  stop(): void {
    if (this.shortcut) {
      globalShortcut.unregister(this.shortcut)
      this.shortcut = ''
    }
    this.onActivate = null
  }
}
