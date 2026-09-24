import { escapeAppleScriptString, runAppleScript } from './osascript.js'

export async function musicPlay(playlist?: string): Promise<void> {
  if (playlist) {
    const safe = escapeAppleScriptString(playlist)
    await runAppleScript(`
      tell application "Music"
        play playlist "${safe}"
      end tell
    `)
  } else {
    await runAppleScript('tell application "Music" to play')
  }
}

export async function musicPause(): Promise<void> {
  await runAppleScript('tell application "Music" to pause')
}

export async function musicNext(): Promise<void> {
  await runAppleScript('tell application "Music" to next track')
}
