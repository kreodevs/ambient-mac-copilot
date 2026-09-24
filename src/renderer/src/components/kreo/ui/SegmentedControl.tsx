import { cn } from '@/lib/utils'

export interface SegmentedOption {
  value: string
  label: string
}

export interface SegmentedControlProps {
  value: string
  onChange: (value: string) => void
  options: SegmentedOption[]
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const sizeClass = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
}

export function SegmentedControl({
  value,
  onChange,
  options,
  size = 'sm',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      className={cn('mac-segmented app-window-no-drag inline-flex', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              'rounded-[var(--radius-sm)] font-medium transition-colors',
              sizeClass[size],
              selected
                ? 'bg-[var(--mac-segment-selected)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]',
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
