import { getLLMClientForAgent } from '../config/providerRegistry.js'
import { getAgentBinding } from '../config/settingsStore.js'
import * as notesService from '../bridge/notesService.js'

export interface MeetingSummary {
  title: string
  summary: string
  actionItems: string[]
  decisions: string[]
  followUpReminders: string[]
}

export async function summarizeMeeting(transcript: string): Promise<MeetingSummary> {
  const binding = getAgentBinding('meetingSummarizer')
  const client = getLLMClientForAgent('meetingSummarizer')

  const prompt = `Summarize this meeting transcript. Reply ONLY with JSON:
{"title":"","summary":"","actionItems":[],"decisions":[],"followUpReminders":[]}

Transcript:
${transcript}`

  const raw = await client.chat([{ role: 'user', content: prompt }], binding.model)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) {
    return {
      title: 'Reunión',
      summary: raw,
      actionItems: [],
      decisions: [],
      followUpReminders: [],
    }
  }

  return JSON.parse(match[0]) as MeetingSummary
}

export async function persistMeetingSummary(summary: MeetingSummary): Promise<void> {
  const body = [
    summary.summary,
    '',
    '## Decisiones',
    ...summary.decisions.map((d) => `- ${d}`),
    '',
    '## Acciones',
    ...summary.actionItems.map((a) => `- ${a}`),
  ].join('\n')

  await notesService.createNote(summary.title, body, 'Reuniones')

  for (const reminder of summary.followUpReminders) {
    await notesService.createReminder(reminder)
  }
}
