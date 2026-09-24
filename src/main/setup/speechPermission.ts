import { createRequire } from 'node:module'
import { loadAppleSpeech } from '../audio/stt/appleSpeechLoader.js'

const require = createRequire(import.meta.url)

type SpeechAuthResponse = {
  authorized?: boolean
  status?: string
}

function getSpeechHelper() {
  const { getHelperProcess } = require(
    'electron-native-speech-backend-macos/dist/helper-process.js',
  ) as {
    getHelperProcess: () => {
      start(): Promise<void>
      send(command: { command: string }, timeoutMs: number): Promise<SpeechAuthResponse>
    }
  }
  return getHelperProcess()
}

export type SpeechPermissionStatus = {
  granted: boolean
  status: string
  reason?: string
}

/** Passive check — does not show the macOS permission dialog. */
export async function getSpeechRecognitionStatus(): Promise<SpeechPermissionStatus> {
  if (process.platform !== 'darwin') {
    return { granted: false, status: 'unsupported', reason: 'Solo disponible en macOS' }
  }

  const availability = await loadAppleSpeech().getSpeechAvailability()
  if (availability.available) {
    return { granted: true, status: 'authorized' }
  }

  const reason = availability.reason ?? 'Reconocimiento de voz no disponible'
  const lower = reason.toLowerCase()

  if (lower.includes('missing nsspeechrecognitionusagedescription')) {
    return { granted: false, status: 'misconfigured', reason }
  }
  if (lower.includes('permission') || lower.includes('denied')) {
    return { granted: false, status: 'denied', reason }
  }
  if (lower.includes('restricted')) {
    return { granted: false, status: 'restricted', reason }
  }

  return { granted: false, status: 'not-determined', reason }
}

/**
 * Triggers SFSpeechRecognizer.requestAuthorization via SpeechHelper.
 * Shows the system dialog when status is notDetermined.
 */
export async function requestSpeechRecognitionPermission(): Promise<SpeechPermissionStatus> {
  if (process.platform !== 'darwin') {
    return { granted: false, status: 'unsupported', reason: 'Solo disponible en macOS' }
  }

  const preflight = await getSpeechRecognitionStatus()
  if (preflight.status === 'misconfigured') return preflight

  try {
    const helper = getSpeechHelper()
    await helper.start()
    const raw = await helper.send({ command: 'requestSpeechAuth' }, 30_000)
    const status = raw.status ?? (raw.authorized ? 'authorized' : 'denied')

    if (raw.authorized) {
      return { granted: true, status: 'authorized' }
    }

    const reason =
      status === 'restricted'
        ? 'El reconocimiento de voz está restringido en este Mac.'
        : 'Permiso denegado. Activa Electron en Ajustes → Privacidad y seguridad → Reconocimiento de voz.'

    return { granted: false, status, reason }
  } catch (err) {
    return {
      granted: false,
      status: 'error',
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
