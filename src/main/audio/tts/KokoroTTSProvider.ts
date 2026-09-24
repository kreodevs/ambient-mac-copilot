import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { resolveKokoroVoice } from '../../../shared/ttsOptions.js'
import { getSettings } from '../../config/settingsStore.js'
import { getKokoroCacheDir, importKokoroJs, isVoiceExtraInstalled } from '../../setup/voiceExtras.js'
import { getResolvedOutputDevice, playWav } from '../audioOutput.js'
import { MacOSTTSProvider } from './MacOSTTSProvider.js'

type KokoroInstance = {
  voices: Readonly<Record<string, unknown>>
  generate: (text: string, opts: { voice: string; speed?: number }) => Promise<{ audio: ArrayBuffer }>
}

let kokoroInstance: KokoroInstance | null = null

async function loadKokoro(): Promise<KokoroInstance | null> {
  if (kokoroInstance) return kokoroInstance
  if (!isVoiceExtraInstalled('kokoro')) {
    console.warn('[KokoroTTS] runtime not installed')
    return null
  }
  try {
    const { KokoroTTS } = await importKokoroJs()
    const settings = getSettings()
    const cacheDir = getKokoroCacheDir()
    await fs.mkdir(cacheDir, { recursive: true })

    kokoroInstance = await (KokoroTTS as {
      from_pretrained: (model: string, opts: Record<string, unknown>) => Promise<KokoroInstance>
    }).from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: settings.tts.dtype,
      device: 'cpu',
      cache_dir: cacheDir,
    })
    return kokoroInstance
  } catch (err) {
    console.warn('[KokoroTTS] load failed, will fallback to macOS say:', err)
    return null
  }
}

export class KokoroTTSProvider {
  private fallback = new MacOSTTSProvider()

  async speak(text: string, onProgress?: (p: number) => void): Promise<void> {
    const settings = getSettings()
    const tts = await loadKokoro()

    if (!tts) {
      await this.fallback.speak(text)
      return
    }

    const available = Object.keys(tts.voices)
    const voice = resolveKokoroVoice(settings.tts.kokoroVoice, available)

    if (voice !== settings.tts.kokoroVoice) {
      console.warn(
        `[KokoroTTS] Voice "${settings.tts.kokoroVoice}" not in this kokoro-js build; using "${voice}"`,
      )
    }

    try {
      onProgress?.(0.3)
      const result = await tts.generate(text, {
        voice,
        speed: settings.tts.speed,
      })
      onProgress?.(0.8)

      const tmp = path.join(os.tmpdir(), `copilot-kokoro-${Date.now()}.wav`)
      await fs.writeFile(tmp, Buffer.from(result.audio))
      const device = await getResolvedOutputDevice()
      await playWav(tmp, device)
      await fs.unlink(tmp).catch(() => {})
      onProgress?.(1)
    } catch (err) {
      console.warn('[KokoroTTS] generate failed:', err)
      await this.fallback.speak(text)
    }
  }
}
