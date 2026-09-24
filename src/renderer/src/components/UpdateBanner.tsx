import { useCallback, useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/types'
import { Button } from '@/components/kreo/ui/Button'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.electronAPI.getUpdateStatus().then(setStatus)
    return window.electronAPI.onUpdateStatus(setStatus)
  }, [])

  const download = useCallback(async () => {
    setDismissed(false)
    const next = await window.electronAPI.downloadUpdate()
    setStatus(next)
  }, [])

  const install = useCallback(async () => {
    await window.electronAPI.installUpdate()
  }, [])

  if (dismissed) return null
  if (status.state !== 'available' && status.state !== 'downloading' && status.state !== 'downloaded') {
    return null
  }

  return (
    <div
      className="mx-3 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-2 text-xs"
      role="status"
    >
      <div className="min-w-0 flex-1">
        {status.state === 'available' && (
          <p>
            Nueva versión <strong>{status.version}</strong> disponible.
          </p>
        )}
        {status.state === 'downloading' && (
          <p>
            Descargando actualización…{' '}
            {status.percent != null ? `${Math.round(status.percent)}%` : ''}
          </p>
        )}
        {status.state === 'downloaded' && (
          <p>
            Versión <strong>{status.version}</strong> lista para instalar.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status.state === 'available' && (
          <>
            <Button size="sm" onClick={download}>Descargar</Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Más tarde
            </Button>
          </>
        )}
        {status.state === 'downloaded' && (
          <>
            <Button size="sm" onClick={install}>Reiniciar e instalar</Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Más tarde
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
