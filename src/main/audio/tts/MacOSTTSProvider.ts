import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { getSettings } from '../../config/settingsStore.js'
import { getResolvedOutputDevice, playWav } from '../audioOutput.js'

const execFileAsync = promisify(execFile)

export class MacOSTTSProvider {
  async speak(text: string): Promise<void> {
    const voice = getSettings().tts.macosVoice
    const tmp = path.join(os.tmpdir(), `copilot-tts-${Date.now()}.aiff`)
    await execFileAsync('say', ['-v', voice, '-o', tmp, text])
    const device = await getResolvedOutputDevice()
    await playWav(tmp, device)
    await fs.unlink(tmp).catch(() => {})
  }
}
