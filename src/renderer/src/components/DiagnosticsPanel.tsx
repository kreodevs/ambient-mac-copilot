import { useState } from 'react'
import type { DiagnosticsReport } from '@shared/types'
import { Button } from '@/components/kreo/ui/Button'
import { cn } from '@/lib/utils'

export function DiagnosticsPanel() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.runDiagnostics()
      setReport(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={run} loading={loading} disabled={loading}>
        Ejecutar diagnóstico
      </Button>

      {report && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--foreground-muted)]">
            Versión {report.version} ·{' '}
            {report.ok ? (
              <span className="text-[var(--success)]">Todo OK</span>
            ) : (
              <span className="text-[var(--warning)]">Hay problemas</span>
            )}
          </p>
          <ul className="space-y-2">
            {report.checks.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'rounded-[var(--radius-sm)] border px-3 py-2 text-sm',
                  item.ok ? 'border-[var(--border)]' : 'border-[var(--warning)]/40 bg-[var(--warning)]/5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className={item.ok ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>
                    {item.ok ? '✓' : '✗'}
                  </span>
                </div>
                {item.detail && (
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.detail}</p>
                )}
                {!item.ok && item.fixHint && (
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.fixHint}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
