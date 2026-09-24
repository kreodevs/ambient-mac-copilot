import { PicovoiceWakeWordProvider } from './PicovoiceWakeWordProvider.js'
import { PushToTalkProvider } from './PushToTalkProvider.js'
import type { ActivationMode, CommandActivationProvider } from './types.js'

export function createActivationProvider(mode: ActivationMode): CommandActivationProvider {
  switch (mode) {
    case 'push-to-talk':
      return new PushToTalkProvider()
    case 'wake-word':
      return new PicovoiceWakeWordProvider()
    case 'none':
      throw new Error('Cannot create provider for mode "none"')
  }
}
