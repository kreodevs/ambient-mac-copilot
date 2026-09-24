import { runAppleScript } from './osascript.js'

export type MaintenanceAction = 'empty_trash' | 'restart_finder'

export async function emptyTrash(): Promise<void> {
  await runAppleScript('tell application "Finder" to empty trash')
}

export async function runMaintenance(action: MaintenanceAction): Promise<void> {
  switch (action) {
    case 'empty_trash':
      await emptyTrash()
      break
    case 'restart_finder':
      await runAppleScript('tell application "Finder" to quit')
      await runAppleScript('tell application "Finder" to activate')
      break
    default:
      throw new Error(`Unknown maintenance action: ${action}`)
  }
}
