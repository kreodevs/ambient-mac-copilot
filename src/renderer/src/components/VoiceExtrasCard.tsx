import { useCallback, useEffect, useState } from 'react'
import type { VoiceExtraId, VoiceExtrasStatus } from '@shared/types'
import { Button } from '@/components/kreo/ui/Button'
import { toast } from 'sonner'

interface VoiceExtrasCardProps {
  ids: VoiceExtraId[]
  onInstalled?: () => void
}

const LABELS: Record<VoiceExtraId, { title: string; description: string }> = {
  kokoro: {
    title: 'Kokoro TTS',
    description: 'Voz neuronal local (ONNX). Requiere descargar runtime y modelo.',
  },
  picovoice: {
    title: 'Picovoice',
    description: 'Motor de wake word. Requiere Access Key y descarga del runtime.',
  },
}

export function VoiceExtrasCard({ ids, onInstalled }: VoiceExtrasCardProps) {
  const [status, setStatus] = useState<VoiceExtrasStatus | null>(null)
  const [progress, setProgress] = useState<Partial<Record<VoiceExtraId, number>>>({})
  const [installing, setInstalling] = useState<VoiceExtraId | null>(null)

  const refresh = useCallback(async () => {
    setStatus(await window.electronAPI.getVoiceExtrasStatus())
  }, [])

  useEffect(() => {
    refresh()
    return window.electronAPI.onVoiceExtraProgress(({ id, progress: p }) => {
      setProgress((prev) => ({ ...prev, [id]: p }))
      if (p >= 1) refresh()
    })
  }, [refresh])

  const install = async (id: VoiceExtraId) => {
    setInstalling(id)
    setProgress((prev) => ({ ...prev, [id]: 0 }))
    try {
      const result = await window.electronAPI.installVoiceExtra(id)
      if (result.ok) {
        toast.success(`${LABELS[id].title} instalado`)
        onInstalled?.()
      } else {
        toast.error(result.error ?? 'Error al instalar')
      }
    } finally {
      setInstalling(null)
      await refresh()
    }
  }

  if (!status) return null

  return (
    <div className="space-y-3">
      {ids.map((id) => {
        const item = status[id]
        const pct = progress[id]
        return (
          <div
            key={id}
            className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{LABELS[id].title}</p>
                <p className="text-xs text-[var(--foreground-muted)]">{LABELS[id].description}</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  {item.installed
                    ? 'Instalado'
                    : `No instalado · ~${item.sizeHintMb} MB`}
                </p>
              </div>
              {!item.installed && (
                <Button
                  size="sm"
                  loading={installing === id || item.installing}
                  disabled={installing !== null}
                  onClick={() => install(id)}
                >
                  Descargar e instalar
                </Button>
              )}
            </div>
            {pct != null && pct < 1 && installing === id && (
              <div className="mt-2">
                <div className="liquid-glass-subtle h-1.5 rounded-full">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${Math.round(pct * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
