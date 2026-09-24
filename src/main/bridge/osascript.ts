import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export function escapeAppleScriptString(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function runAppleScript(script: string): Promise<string> {
  const { stdout } = await execFileAsync('osascript', ['-e', script], {
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  })
  return stdout.trim()
}

export async function runAppleScriptMulti(lines: string[]): Promise<string> {
  const script = lines.join('\n')
  return runAppleScript(script)
}
