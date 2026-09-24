import { getSettings } from '../../config/settingsStore.js'
import { KokoroTTSProvider } from './KokoroTTSProvider.js'
import { MacOSTTSProvider } from './MacOSTTSProvider.js'

export function createTTSProvider() {
  const settings = getSettings()
  if (settings.tts.provider === 'kokoro') return new KokoroTTSProvider()
  return new MacOSTTSProvider()
}
