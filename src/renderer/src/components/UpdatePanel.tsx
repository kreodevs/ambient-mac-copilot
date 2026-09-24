import { useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/types'
import { Button } from '@/components/kreo/ui/Button'

export function UpdatePanel() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    window.electronAPI.getUpdateStatus().then(setStatus)
    return window.electronAPI.onUpdateStatus(setStatus)
  }, [])

  const check = async () => {
    setChecking(true)
    try {
      const next = await window.electronAPI.checkForUpdates()
      setStatus(next)
    } finally {
      setChecking(false)
    }
  }

  const statusLabel = (() => {
    switch (status.state) {
      case 'checking':
        return 'Comprobando…'
      case 'available':
        return `Actualización ${status.version} disponible`
      case 'not-available':
        return 'Estás en la última versión'
      case 'downloading':
        return `Descargando… ${status.percent != null ? `${Math.round(status.percent)}%` : ''}`
      case 'downloaded':
        return `Versión ${status.version} lista para instalar`
      case 'error':
        return status.message
      default:
        return 'Las actualizaciones se comprueban automáticamente'
    }
  })()

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--foreground-muted)]">{statusLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={check} loading={checking} disabled={checking}>
          Buscar actualizaciones
        </Button>
        {status.state === 'available' && (
          <Button variant="secondary" onClick={() => window.electronAPI.downloadUpdate()}>
            Descargar
          </Button>
        )}
        {status.state === 'downloaded' && (
          <Button variant="secondary" onClick={() => window.electronAPI.installUpdate()}>
            Reiniciar e instalar
          </Button>
        )}
      </div>
      <p className="text-xs text-[var(--foreground-muted)]">
        Las releases se publican en{' '}
        <a
          href="https://github.com/kreodevs/ambient-mac-copilot/releases"
          className="text-[var(--primary)] underline"
          target="_blank"
          rel="noreferrer"
        >
          GitHub Releases
        </a>
        . La app te avisará cuando haya una versión nueva.
      </p>
    </div>
  )
}
