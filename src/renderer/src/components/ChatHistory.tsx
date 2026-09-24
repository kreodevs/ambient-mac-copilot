import type { ChatMessage } from '@shared/types'
import { EmailDetailCard, isEmailDetail } from './EmailDetailCard'
import { EmailListCard, isEmailList } from './EmailListCard'
import { MailTriageCard } from './MailTriageCard'
import { MeetingSummaryCard } from './MeetingSummaryCard'
import { isToolPreview, ToolPreviewCard } from './ToolPreviewCard'

interface ChatHistoryProps {
  messages: ChatMessage[]
  loading?: boolean
}

export function ChatHistory({ messages, loading }: ChatHistoryProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-sm text-[var(--foreground-muted)]">
        Escribe un mensaje o usa <kbd className="rounded bg-white/10 px-1">⌘⇧Space</kbd> para abrir el copilot.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={
            msg.role === 'user'
              ? 'liquid-glass-msg-user ml-4 rounded-[var(--radius-md)] px-3 py-2 text-sm'
              : 'liquid-glass-msg-assistant mr-4 rounded-[var(--radius-md)] px-3 py-2 text-sm'
          }
        >
          <div className="mb-0.5 text-xs text-[var(--foreground-muted)]">
            {msg.role === 'user' ? 'Tú' : 'Copilot'}
          </div>
          <p className="whitespace-pre-wrap">{msg.content}</p>
          {isMailTriage(msg.actionData) ? <MailTriageCard data={msg.actionData} /> : null}
          {isEmailList(msg.actionData) ? (
            <EmailListCard emails={msg.actionData.emails} />
          ) : null}
          {isEmailDetail(msg.actionData) ? (
            <EmailDetailCard email={msg.actionData.email} />
          ) : null}
          {isMeetingSummary(msg.actionData) ? <MeetingSummaryCard data={msg.actionData} /> : null}
          {isToolPreview(msg.actionData) ? (
            <ToolPreviewCard
              previewId={msg.actionData.previewId}
              preview={msg.actionData.preview}
            />
          ) : null}
        </div>
      ))}
      {loading && (
        <div className="mr-4 rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--foreground-muted)]">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
            Pensando…
          </span>
        </div>
      )}
    </div>
  )
}

interface MailTriageAction {
  emails: Array<{ subject: string; sender: string }>
  archived: string[]
}

function isMailTriage(data: unknown): data is MailTriageAction {
  if (typeof data !== 'object' || data === null) return false
  if ((data as { type?: string }).type === 'email_list') return false
  return 'emails' in data && 'archived' in data
}

function isMeetingSummary(data: unknown): data is { title: string; summary: string } {
  return typeof data === 'object' && data !== null && 'summary' in data && 'title' in data
}
