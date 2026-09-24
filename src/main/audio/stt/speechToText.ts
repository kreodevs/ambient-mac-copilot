import { getSettings } from '../../config/settingsStore.js'
import { createSTTProvider } from './createSTTProvider.js'
import { AppleSpeechSTTProvider } from './AppleSpeechSTTProvider.js'
import { CloudSTTProvider } from './CloudSTTProvider.js'

async function transcribeLiveWithFallback(): Promise<string> {
  const settings = getSettings()
  const provider = createSTTProvider()

  try {
    const text = await provider.transcribeLive()
    if (text) return text
  } catch (err) {
    console.warn('[stt] primary live transcription failed:', err)
  }

  if (settings.stt.provider === 'auto' && process.platform === 'darwin') {
    try {
      const apple = new AppleSpeechSTTProvider()
      const text = await apple.transcribeLive()
      if (text) return text
    } catch (err) {
      console.warn('[stt] Apple Speech fallback failed:', err)
    }
  }

  return ''
}

export async function transcribeLive(): Promise<string> {
  const settings = getSettings()

  try {
    return await transcribeLiveWithFallback()
  } catch {
    if (settings.stt.provider === 'auto') return ''
    throw new Error('STT transcription failed')
  }
}

export async function transcribeFile(filePath: string): Promise<string> {
  const settings = getSettings()
  const provider = createSTTProvider()

  try {
    const text = await provider.transcribeFile(filePath)
    if (text) return text
  } catch (err) {
    console.warn('[stt] primary file transcription failed:', err)
  }

  if (settings.stt.provider === 'auto' || settings.stt.provider === 'apple') {
    if (process.platform === 'darwin') {
      try {
        const apple = new AppleSpeechSTTProvider()
        const text = await apple.transcribeFile(filePath)
        if (text) return text
      } catch (err) {
        console.warn('[stt] Apple Speech file fallback failed:', err)
      }
    }
  }

  if (settings.stt.provider === 'auto' || settings.stt.provider === 'cloud') {
    const cloud = new CloudSTTProvider()
    return cloud.transcribeFile(filePath)
  }

  throw new Error('STT file transcription failed')
}
