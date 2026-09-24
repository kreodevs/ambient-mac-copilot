interface Email {
  subject: string
  sender: string
}

interface MailTriageData {
  type?: 'mail_triage'
  emails: Email[]
  archived: string[]
}

interface MailTriageCardProps {
  data: MailTriageData
}

export function MailTriageCard({ data }: MailTriageCardProps) {
  return (
    <div className="mac-inline-card mt-2">
      <p className="mb-2 text-xs text-[var(--foreground-muted)]">
        {data.emails.length} sin leer · {data.archived.length} archivados
      </p>
      <ul className="space-y-1 text-xs">
        {data.emails.slice(0, 5).map((e, i) => (
          <li key={i} className="truncate">
            <span className="text-[var(--foreground-muted)]">{e.sender}</span> — {e.subject}
          </li>
        ))}
      </ul>
    </div>
  )
}
