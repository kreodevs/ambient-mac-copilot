import fs from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { desktopCapturer, systemPreferences } from 'electron'
import {
  hasAppSecret,
  hasProviderSecret,
  setAppSecret,
  updateProviderSecret,
} from '../db/providerRepository.js'
import { getSettings, updateSettings } from '../config/settingsStore.js'
import { loadAppleSpeech } from '../audio/stt/appleSpeechLoader.js'
import { openSystemPrefsPane } from './systemPrefs.js'
import {
  getSpeechRecognitionStatus,
  requestSpeechRecognitionPermission,
} from './speechPermission.js'

const execFileAsync = promisify(execFile)

export function bootstrapSecretsFromEnv(): { configured: string[] } {
  const configured: string[] = []

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim()
  if (openRouterKey && !hasProviderSecret('openrouter-main')) {
    updateProviderSecret('openrouter-main', openRouterKey)
    configured.push('openrouter-main')
  }

  const picovoiceKey =
    process.env.PICOVOICE_ACCESS_KEY?.trim() ?? process.env.PICOVOICE_API_KEY?.trim()
  if (picovoiceKey && !hasAppSecret('picovoice')) {
    setAppSecret('picovoice', picovoiceKey)
    configured.push('picovoice')
  }

  return { configured }
}

export async function checkPrerequisites(): Promise<{
  ffmpeg: { installed: boolean; path: string }
  blackhole: { installed: boolean }
}> {
  const settings = getSettings()
  let ffmpegPath = settings.audio.ffmpegPath

  let ffmpegInstalled = false
  try {
    await execFileAsync(ffmpegPath, ['-version'])
    ffmpegInstalled = true
  } catch {
    try {
      const { stdout } = await execFileAsync('which', ['ffmpeg'])
      ffmpegPath = stdout.trim()
      await execFileAsync(ffmpegPath, ['-version'])
      ffmpegInstalled = true
      updateSettings({ audio: { ...settings.audio, ffmpegPath } })
    } catch {
      ffmpegInstalled = false
    }
  }

  const blackholeInstalled = fs.existsSync('/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver')

  return {
    ffmpeg: { installed: ffmpegInstalled, path: ffmpegPath },
    blackhole: { installed: blackholeInstalled },
  }
}

export async function requestMicrophonePermission(): Promise<{
  status: string
  granted: boolean
}> {
  if (process.platform !== 'darwin') {
    return { status: 'granted', granted: true }
  }

  const before = systemPreferences.getMediaAccessStatus('microphone')
  if (before !== 'granted') {
    await systemPreferences.askForMediaAccess('microphone')
  }

  const status = systemPreferences.getMediaAccessStatus('microphone')
  return { status, granted: status === 'granted' }
}

export function openScreenRecordingPrefs(): void {
  void openSystemPrefsPane('screen')
}

export function openMicrophonePrefs(): void {
  void openSystemPrefsPane('microphone')
}

export function openSpeechRecognitionPrefs(): void {
  void openSystemPrefsPane('speech')
}

export async function checkAppleSpeechAvailability(): Promise<{
  available: boolean
  reason?: string
}> {
  if (process.platform !== 'darwin') {
    return { available: false, reason: 'Apple Speech solo está disponible en macOS' }
  }

  try {
    const speech = loadAppleSpeech()
    const availability = await speech.getSpeechAvailability()
    return { available: availability.available, reason: availability.reason }
  } catch (err) {
    return {
      available: false,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

export { requestSpeechRecognitionPermission } from './speechPermission.js'

export function openAutomationPrefs(): void {
  void openSystemPrefsPane('automation')
}

export async function checkAllPermissions(): Promise<{
  microphone: string
  screen: string
  speech: string
  microphoneGranted: boolean
  screenGranted: boolean
  speechGranted: boolean
  allGranted: boolean
}> {
  const mic =
    process.platform === 'darwin'
      ? systemPreferences.getMediaAccessStatus('microphone')
      : 'granted'
  const screen =
    process.platform === 'darwin'
      ? systemPreferences.getMediaAccessStatus('screen')
      : 'granted'
  const speech = await getSpeechRecognitionStatus()

  return {
    microphone: mic,
    screen,
    speech: speech.status,
    microphoneGranted: mic === 'granted',
    screenGranted: screen === 'granted',
    speechGranted: speech.granted,
    allGranted: mic === 'granted' && screen === 'granted' && speech.granted,
  }
}

/** Triggers macOS Screen Recording prompt (Electron must be allowed in System Settings). */
export async function requestScreenRecordingPermission(): Promise<{
  status: string
  granted: boolean
}> {
  if (process.platform !== 'darwin') {
    return { status: 'granted', granted: true }
  }

  try {
    await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1, height: 1 },
    })
  } catch (err) {
    console.warn('[permissions] screen capture probe failed:', err)
  }

  const status = systemPreferences.getMediaAccessStatus('screen')
  return { status, granted: status === 'granted' }
}

export async function requestAllPermissions(): Promise<{
  microphone: { status: string; granted: boolean }
  screen: { status: string; granted: boolean }
  speech: { status: string; granted: boolean; reason?: string }
  allGranted: boolean
}> {
  const microphone = await requestMicrophonePermission()
  const screen = await requestScreenRecordingPermission()
  const speech = await requestSpeechRecognitionPermission()
  return {
    microphone,
    screen,
    speech,
    allGranted: microphone.granted && screen.granted && speech.granted,
  }
}
