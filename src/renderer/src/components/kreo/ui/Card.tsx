import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
  unpadded?: boolean
  children?: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subtitle, footer, className, bodyClassName, unpadded, children, ...props }, ref) => {
    const hasHeader = title || subtitle

    return (
      <div
        ref={ref}
        className={cn('liquid-glass-subtle overflow-hidden rounded-[var(--radius-md)]', className)}
        {...props}
      >
        {hasHeader && (
          <div className="border-b border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {title && <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>}
            {subtitle && (
              <p className="mt-[var(--spacing-xxs)] text-sm text-[var(--foreground-muted)]">{subtitle}</p>
            )}
          </div>
        )}
        {children && (
          <div
            className={cn(
              !unpadded && 'px-[var(--spacing-md)] py-[var(--spacing-md)]',
              bodyClassName,
            )}
          >
            {children}
          </div>
        )}
        {footer && (
          <div className="border-t border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]">
            {footer}
          </div>
        )}
      </div>
    )
  },
)

Card.displayName = 'Card'

export const CardHeader = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={cn('border-b border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]', className)}>
    {children}
  </div>
)

export const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-[var(--spacing-md)] py-[var(--spacing-md)]', className)}>{children}</div>
)

export const CardFooter = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={cn('border-t border-[var(--border)] px-[var(--spacing-md)] py-[var(--spacing-md)]', className)}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <h3 className={cn('text-lg font-semibold text-[var(--foreground)]', className)}>{children}</h3>
)

export const CardDescription = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={cn('text-sm text-[var(--foreground-muted)]', className)}>{children}</p>
)

export default Card
