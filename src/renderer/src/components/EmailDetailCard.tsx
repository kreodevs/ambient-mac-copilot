interface EmailDetail {
  id: string
  subject: string
  sender: string
  date: string
  body: string
}

interface EmailDetailData {
  type: 'email_detail'
  email: EmailDetail
}

interface EmailDetailCardProps {
  email: EmailDetail
}

export function EmailDetailCard({ email }: EmailDetailCardProps) {
  return (
    <div className="mac-inline-card mt-2 space-y-2 text-xs">
      <div>
        <p className="font-medium text-[var(--foreground)]">{email.subject}</p>
        <p className="text-[var(--foreground-muted)]">{email.sender}</p>
        <p className="text-[var(--foreground-muted)]">{email.date}</p>
      </div>
      <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[var(--foreground)]">
        {email.body}
      </p>
    </div>
  )
}

export function isEmailDetail(data: unknown): data is EmailDetailData {
  return typeof data === 'object' && data !== null && (data as EmailDetailData).type === 'email_detail'
}
