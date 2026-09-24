import { getSettings } from '../../config/settingsStore.js'
import { isVoiceExtraInstalled } from '../../setup/voiceExtras.js'
import { KokoroTTSProvider } from './KokoroTTSProvider.js'
import { MacOSTTSProvider } from './MacOSTTSProvider.js'

export function createTTSProvider() {
  const settings = getSettings()
  if (settings.tts.provider === 'kokoro' && isVoiceExtraInstalled('kokoro')) {
    return new KokoroTTSProvider()
  }
  return new MacOSTTSProvider()
}
