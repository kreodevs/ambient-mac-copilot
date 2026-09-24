import { getSettings } from '../../config/settingsStore.js'
import { AppleSpeechSTTProvider } from './AppleSpeechSTTProvider.js'
import { CloudSTTProvider } from './CloudSTTProvider.js'

export function createSTTProvider() {
  const settings = getSettings()

  if (settings.stt.provider === 'cloud') return new CloudSTTProvider()
  if (settings.stt.provider === 'apple') return new AppleSpeechSTTProvider()
  if (settings.stt.provider === 'auto' && process.platform === 'darwin') {
    return new AppleSpeechSTTProvider()
  }

  return new CloudSTTProvider()
}
