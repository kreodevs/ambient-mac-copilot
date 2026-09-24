interface EmailRow {
  id: string
  subject: string
  sender: string
  date: string
  read?: boolean
}

interface EmailListData {
  type: 'email_list'
  emails: EmailRow[]
}

interface EmailListCardProps {
  emails: EmailRow[]
}

export function EmailListCard({ emails }: EmailListCardProps) {
  if (emails.length === 0) {
    return (
      <div className="mac-inline-card mt-2 text-xs text-[var(--foreground-muted)]">
        Sin resultados.
      </div>
    )
  }

  return (
    <div className="mac-inline-card mt-2">
      <ul className="space-y-2 text-xs">
        {emails.slice(0, 10).map((email) => (
          <li key={email.id} className="border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-[var(--foreground)]">{email.sender}</span>
              {email.read === false && (
                <span className="shrink-0 text-[var(--primary)]">●</span>
              )}
            </div>
            <p className="truncate text-[var(--foreground)]">{email.subject}</p>
            <p className="text-[var(--foreground-muted)]">{email.date}</p>
          </li>
        ))}
      </ul>
      {emails.length > 10 && (
        <p className="mt-2 text-[var(--foreground-muted)]">… y {emails.length - 10} más</p>
      )}
    </div>
  )
}

export function isEmailList(data: unknown): data is EmailListData {
  return typeof data === 'object' && data !== null && (data as EmailListData).type === 'email_list'
}
