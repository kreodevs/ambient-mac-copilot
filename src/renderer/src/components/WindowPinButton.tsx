import { Pin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WindowPinButtonProps {
  pinned: boolean
  onToggle: () => void
  disabled?: boolean
}

export function WindowPinButton({ pinned, onToggle, disabled }: WindowPinButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'app-window-no-drag flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        pinned
          ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
          : 'text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
        disabled && 'pointer-events-none opacity-50',
      )}
      aria-label={pinned ? 'Desanclar ventana' : 'Mantener ventana visible'}
      aria-pressed={pinned}
      title={pinned ? 'Anclada — no se oculta al perder el foco' : 'Anclar — mantener visible'}
      onClick={onToggle}
      disabled={disabled}
    >
      <Pin className={cn('h-4 w-4', pinned && 'fill-current')} />
    </button>
  )
}
