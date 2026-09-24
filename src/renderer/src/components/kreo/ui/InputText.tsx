import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { cn } from "@/lib/utils"

export interface InputTextProps extends ComponentPropsWithoutRef<'input'> {
  error?: boolean
  fullWidth?: boolean
  /** Static label above the field */
  label?: string
  /** Label floats inside the field on focus/value — requires `label` */
  floatingLabel?: boolean
}

export const InputText = forwardRef<HTMLInputElement, InputTextProps>(
  ({ error, fullWidth, label, floatingLabel = false, className, id, ...props }, ref) => {
    const [shakeKey, setShakeKey] = useState(0)

    useEffect(() => {
      if (error) {
        setShakeKey((k) => k + 1)
      }
    }, [error])

    const baseStyles = cn(
      'app-window-no-drag flex h-10 rounded-[var(--radius)]',
      'liquid-glass-input border border-[var(--input-border)] bg-[var(--input)]',
      'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
      'text-sm text-[var(--foreground)]',
      'placeholder:text-[var(--foreground-muted)]',
      'transition-all duration-[var(--transition-base)]',
      'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
      'focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]',
      'focus:border-[var(--input-focus)]',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--foreground)]',
      error && 'border-[var(--destructive)] focus:ring-[var(--destructive)]',
      error && shakeKey > 0 && 'animate-kreo-shake-x',
      fullWidth && 'w-full',
      className,
    )

    const resolvedId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    if (floatingLabel && label) {
      return (
        <div className={cn('kreo-floating-field', fullWidth && 'w-full')}>
          <input
            ref={ref}
            id={resolvedId}
            placeholder=" "
            className={baseStyles}
            aria-invalid={error || undefined}
            {...props}
          />
          <label htmlFor={resolvedId} className="kreo-floating-label">
            {label}
          </label>
        </div>
      )
    }

    const input = (
      <input
        ref={ref}
        id={resolvedId}
        className={baseStyles}
        aria-invalid={error || undefined}
        {...props}
      />
    )

    if (!label) return input

    return (
      <div className={cn('flex flex-col gap-[var(--spacing-xs)]', fullWidth && 'w-full')}>
        <label htmlFor={resolvedId} className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
        {input}
      </div>
    )
  },
)

InputText.displayName = 'InputText'

export default InputText
