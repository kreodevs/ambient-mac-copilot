import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassShellProps {
  children: ReactNode
  className?: string
}

/** Contenedor principal estilo Liquid Glass (blur + brillo especular). */
export function GlassShell({ children, className }: GlassShellProps) {
  return (
    <div
      className={cn(
        'liquid-glass-panel relative flex flex-col overflow-hidden rounded-[var(--radius)] text-[var(--card-foreground)]',
        className,
      )}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
