import { getSettings } from '../../config/settingsStore.js'
import { toAppleSpeechLocale } from './appleSpeechLocale.js'
import { loadAppleSpeech } from './appleSpeechLoader.js'

const LIVE_LISTEN_MS = 8_000

export class AppleSpeechSTTProvider {
  async ensureAvailable(): Promise<void> {
    const speech = loadAppleSpeech()
    const availability = await speech.getSpeechAvailability()
    if (!availability.available) {
      throw new Error(availability.reason ?? 'Apple Speech no está disponible en este Mac')
    }
  }

  async transcribeLive(): Promise<string> {
    await this.ensureAvailable()

    const speech = loadAppleSpeech()
    const locale = toAppleSpeechLocale(getSettings().stt.language)
    const session = await speech.createSpeechSession()

    let latestText = ''
    let settled = false

    return new Promise((resolve, reject) => {
      const finish = async (text: string) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        try {
          await session.stop().catch(() => {})
          await session.dispose().catch(() => {})
        } catch {
          /* ignore cleanup errors */
        }
        resolve(text.trim())
      }

      const fail = async (err: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        try {
          await session.abort().catch(() => {})
          await session.dispose().catch(() => {})
        } catch {
          /* ignore cleanup errors */
        }
        reject(err)
      }

      const timer = setTimeout(() => {
        finish(latestText)
      }, LIVE_LISTEN_MS)

      session.on('error', (error) => {
        if (error.code === 'no-speech-detected') {
          finish('')
          return
        }
        fail(new Error(error.message))
      })

      session.on('result', (result) => {
        if (result.text) latestText = result.text
        if (result.isFinal && result.text.trim()) {
          finish(result.text)
        }
      })

      session
        .start({ locale, interimResults: true, continuous: false })
        .catch((err: unknown) => {
          fail(err instanceof Error ? err : new Error(String(err)))
        })
    })
  }

  async transcribeFile(filePath: string): Promise<string> {
    await this.ensureAvailable()

    const speech = loadAppleSpeech()
    const locale = toAppleSpeechLocale(getSettings().stt.language)
    const result = await speech.transcribeFile({ filePath, locale })
    return result.segments.map((segment) => segment.text).join(' ').trim()
  }
}
