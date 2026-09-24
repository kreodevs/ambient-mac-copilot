import { useState } from 'react'
import type { ToolPreviewPayload } from '@shared/types'
import { Button } from '@/components/kreo/ui/Button'
import { toast } from 'sonner'

interface ToolPreviewData {
  type: 'tool_preview'
  previewId: string
  preview: ToolPreviewPayload
}

interface ToolPreviewCardProps {
  previewId: string
  preview: ToolPreviewPayload
}

export function ToolPreviewCard({ previewId, preview }: ToolPreviewCardProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const confirm = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.confirmToolPreview(previewId)
      if (result.ok) {
        toast.success(result.reply)
        setDone(true)
      } else {
        toast.error(result.error ?? result.reply)
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mac-inline-card mt-2 text-xs text-[var(--foreground-muted)]">
        Acción confirmada y ejecutada.
      </div>
    )
  }

  return (
    <div className="mac-inline-card mt-2 space-y-2">
      <p className="text-sm font-medium">{preview.summary}</p>
      {preview.risks.length > 0 && (
        <ul className="list-disc pl-4 text-xs text-[var(--warning)]">
          {preview.risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={confirm} loading={loading} disabled={loading}>
          Confirmar
        </Button>
      </div>
    </div>
  )
}

export function isToolPreview(data: unknown): data is ToolPreviewData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ToolPreviewData).type === 'tool_preview' &&
    typeof (data as ToolPreviewData).previewId === 'string'
  )
}
