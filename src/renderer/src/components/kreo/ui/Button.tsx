import { Loader2 } from 'lucide-react'
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from "@/lib/utils"

function getAsChildElement(children: ReactNode): ReactElement {
  if (isValidElement(children)) {
    return children
  }
  const elements = Children.toArray(children).filter(isValidElement)
  if (elements.length === 1) {
    return elements[0]
  }
  throw new Error('Button with asChild expects a single React element child.')
}

const buttonVariants = cva(
  "app-window-no-drag inline-flex items-center justify-center gap-[var(--spacing-sm)] font-medium rounded-[var(--radius)] transition-all duration-[var(--transition-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-sm)] shadow-none hover:bg-[var(--primary-hover)] active:opacity-85',
        secondary: 'liquid-glass-subtle text-[var(--secondary-foreground)] hover:border-[var(--border-hover)] active:scale-[0.98]',
        outline: 'liquid-glass-subtle text-[var(--foreground)] hover:border-[var(--border-hover)] active:scale-[0.98]',
        ghost: 'bg-transparent text-[var(--foreground)] hover:liquid-glass-subtle active:scale-[0.98]',
        destructive: 'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90 shadow-sm active:scale-[0.98]',
        link: 'bg-transparent text-[var(--primary)] kreo-underline-draw underline-offset-4 hover:no-underline',
        tactile: [
          'bg-[var(--primary)] text-[var(--primary-foreground)]',
          'shadow-[0_5px_0_0_var(--accent-muted)]',
          'hover:bg-[var(--primary-hover)]',
          'active:translate-y-[5px] active:shadow-[0_1px_0_0_var(--accent-muted)]',
          'transition-[transform,box-shadow,background-color]',
          '[transition-duration:var(--press-fast)]',
          'motion-reduce:active:translate-y-0',
        ].join(' '),
      },
      size: {
        default: 'h-10 px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm',
        sm: 'h-8 px-[var(--spacing-md)] text-xs',
        lg: 'h-12 px-[var(--spacing-lg)] text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading, disabled, asChild = false, children, className, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))

    if (asChild) {
      const child = getAsChildElement(children)
      const childProps = child.props as { className?: string }
      return cloneElement(child, {
        ...props,
        className: cn(classes, childProps.className),
        ref,
      } as Record<string, unknown>)
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }
export default Button
