import { escapeAppleScriptString, runAppleScript } from './osascript.js'

export async function createNote(
  title: string,
  content: string,
  folder = 'Reuniones',
): Promise<void> {
  const safeTitle = escapeAppleScriptString(title)
  const safeContent = escapeAppleScriptString(content)
  const safeFolder = escapeAppleScriptString(folder)

  await runAppleScript(`
    tell application "Notes"
      tell folder "${safeFolder}"
        make new note with properties {name:"${safeTitle}", body:"${safeContent}"}
      end tell
    end tell
  `)
}

export async function createReminder(title: string, dueDateIso?: string): Promise<void> {
  const safeTitle = escapeAppleScriptString(title)
  let dueClause = ''
  if (dueDateIso) {
    const safeDate = escapeAppleScriptString(dueDateIso)
    dueClause = `, due date:date "${safeDate}"`
  }

  await runAppleScript(`
    tell application "Reminders"
      make new reminder with properties {name:"${safeTitle}"${dueClause}}
    end tell
  `)
}
