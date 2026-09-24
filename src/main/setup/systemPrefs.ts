import { shell } from 'electron'

const PREF_URLS = {
  microphone: [
    'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Microphone',
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone',
  ],
  screen: [
    'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_ScreenCapture',
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  ],
  speech: [
    'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_SpeechRecognition',
    'x-apple.systempreferences:com.apple.preference.security?Privacy_SpeechRecognition',
  ],
  automation: [
    'x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_Automation',
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
  ],
} as const

export type SystemPrefsPane = keyof typeof PREF_URLS

/** Opens a System Settings privacy pane, trying Ventura+ URLs first. */
export async function openSystemPrefsPane(pane: SystemPrefsPane): Promise<void> {
  for (const url of PREF_URLS[pane]) {
    try {
      const opened = await shell.openExternal(url)
      if (opened) return
    } catch (err) {
      console.warn(`[system-prefs] failed to open ${url}:`, err)
    }
  }
}
