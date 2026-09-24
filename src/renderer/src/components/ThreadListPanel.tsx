import type { ChatThread } from '@shared/types'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThreadListPanelProps {
  threads: ChatThread[]
  activeId: string
  onSelect: (id: string) => void
  onCreate: () => void
}

export function ThreadListPanel({ threads, activeId, onSelect, onCreate }: ThreadListPanelProps) {
  return (
    <div className="mac-sidebar flex w-[132px] shrink-0 flex-col min-h-0 rounded-[var(--radius-sm)] py-2 pl-2 pr-1">
      <div className="mb-2 flex shrink-0 items-center justify-between pr-1">
        <span className="text-xs font-medium text-[var(--foreground-muted)]">Hilos</span>
        <button
          type="button"
          onClick={onCreate}
          className="app-window-no-drag flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          title="Nuevo hilo (⌘N)"
          aria-label="Nuevo hilo"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              'w-full truncate rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs transition-colors',
              activeId === t.id
                ? 'bg-[var(--mac-segment-selected)] font-medium text-[var(--foreground)]'
                : 'text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
            )}
          >
            {t.title}
          </button>
        ))}
      </div>
    </div>
  )
}
