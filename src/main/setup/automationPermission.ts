import { runAppleScript } from '../bridge/osascript.js'

export type AutomationTarget = 'mail' | 'notes' | 'reminders'

const PROBES: Record<AutomationTarget, string> = {
  mail: 'tell application "Mail" to get name',
  notes: 'tell application "Notes" to get name',
  reminders: 'tell application "Reminders" to get name',
}

const LABELS: Record<AutomationTarget, string> = {
  mail: 'Mail',
  notes: 'Notes',
  reminders: 'Reminders',
}

export type AutomationProbeResult = {
  target: AutomationTarget
  label: string
  ok: boolean
  error?: string
}

/** Triggers the macOS Automation consent dialog for one target app. */
export async function probeAutomationPermission(
  target: AutomationTarget,
): Promise<AutomationProbeResult> {
  try {
    await runAppleScript(PROBES[target])
    return { target, label: LABELS[target], ok: true }
  } catch (err) {
    return {
      target,
      label: LABELS[target],
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function probeAllAutomationPermissions(): Promise<AutomationProbeResult[]> {
  const targets: AutomationTarget[] = ['mail', 'notes', 'reminders']
  const results: AutomationProbeResult[] = []
  for (const target of targets) {
    results.push(await probeAutomationPermission(target))
  }
  return results
}
