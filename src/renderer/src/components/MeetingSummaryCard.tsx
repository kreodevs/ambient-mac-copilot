interface MeetingSummaryData {
  title: string
  summary: string
  actionItems?: string[]
}

interface MeetingSummaryCardProps {
  data: MeetingSummaryData
}

export function MeetingSummaryCard({ data }: MeetingSummaryCardProps) {
  return (
    <div className="mac-inline-card mt-2">
      <h4 className="text-sm font-medium">{data.title}</h4>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">{data.summary}</p>
      {data.actionItems && data.actionItems.length > 0 && (
        <ul className="mt-2 list-disc pl-4 text-xs">
          {data.actionItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
