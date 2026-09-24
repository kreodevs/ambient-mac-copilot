import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const MEETING_APPS = [
  'zoom.us',
  'Microsoft Teams',
  'Google Chrome.*meet',
  'Slack',
  'Webex',
]

export async function isMeetingActive(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('ps', ['-ax', '-o', 'comm='])
    return MEETING_APPS.some((pattern) => {
      const regex = new RegExp(pattern, 'i')
      return stdout.split('\n').some((line) => regex.test(line))
    })
  } catch {
    return false
  }
}
