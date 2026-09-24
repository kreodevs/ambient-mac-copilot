import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { forwardRef, ReactNode, useState, useEffect, useCallback, useRef } from 'react'
import { cn } from "@/lib/utils"

export interface TabItemProps {
  value?: string
  label: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
  children: ReactNode
}

export interface TabViewInputProps {
  tabs?: TabItemProps[]
  variant?: 'default' | 'bordered' | 'pills' | 'underline' | 'segmented'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children?: ReactNode
  /** Controlled active tab index (0-based) — maps to Radix value internally */
  activeIndex?: number
  /** Default tab value for uncontrolled usage */
  defaultValue?: string
  /** Called when the active tab changes — receives the tab's string value */
  onTabChange?: (value: string) => void
  className?: string
}

function resolveTabValue(tab: TabItemProps, index: number): string {
  if (tab.value) return tab.value
  const slug = tab.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || `tab-${index}`
}

const sizeStyles = {
  sm: { tab: 'px-[var(--spacing-md)] py-[var(--spacing-xs)] text-xs', icon: 'w-3 h-3', badge: 'text-[10px] px-[var(--spacing-xs)] py-[var(--spacing-xxs)]' },
  md: { tab: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm', icon: 'w-4 h-4', badge: 'text-xs px-[var(--spacing-sm)] py-[var(--spacing-xxs)]' },
  lg: { tab: 'px-[var(--spacing-lg)] py-[var(--spacing-sm)] text-base', icon: 'w-5 h-5', badge: 'text-xs px-[var(--spacing-sm)] py-[var(--spacing-xs)]' },
}

const variantStyles = {
  default: {
    nav: 'flex border-b border-[var(--border)] bg-[var(--secondary)]',
    tab: `
      relative font-medium
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)] hover:bg-[var(--muted)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:after:absolute
      data-[state=active]:after:bottom-0
      data-[state=active]:after:left-0
      data-[state=active]:after:right-0
      data-[state=active]:after:h-0.5
      data-[state=active]:after:bg-[var(--accent)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] bg-[var(--card)]',
  },
  bordered: {
    nav: 'flex border border-[var(--border)] rounded-t-[var(--radius)] bg-[var(--secondary)] overflow-hidden',
    tab: `
      font-medium border-r border-[var(--border)] last:border-r-0
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)] hover:bg-[var(--muted)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:bg-[var(--card)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] border border-t-0 border-[var(--border)] rounded-b-[var(--radius)] bg-[var(--card)]',
  },
  pills: {
    nav: 'liquid-glass-pill relative flex gap-[var(--spacing-sm)] p-[var(--spacing-xs)] rounded-[var(--radius)]',
    tab: `
      relative z-[1] font-medium rounded-[var(--radius-sm)]
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)]
      transition-colors duration-[var(--transition-base)]
      data-[state=active]:text-[var(--primary-foreground)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] mt-[var(--spacing-sm)]',
  },
  segmented: {
    nav: 'mac-segmented inline-flex gap-0',
    tab: `
      relative z-[1] font-medium rounded-[var(--radius-sm)]
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)]
      transition-colors duration-[var(--transition-fast)]
      data-[state=active]:text-[var(--foreground)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)]',
  },
  underline: {
    nav: 'flex gap-[var(--spacing-md)]',
    tab: `
      relative font-medium pb-[var(--spacing-sm)]
      text-[var(--foreground-muted)]
      hover:text-[var(--foreground)]
      transition-colors
      data-[state=active]:text-[var(--accent)]
      data-[state=active]:after:absolute
      data-[state=active]:after:bottom-0
      data-[state=active]:after:left-0
      data-[state=active]:after:right-0
      data-[state=active]:after:h-0.5
      data-[state=active]:after:bg-[var(--accent)]
      data-[state=active]:after:rounded-full
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    content: 'p-[var(--spacing-md)] border-t border-[var(--border)]',
  },
}

export const TabView = forwardRef<HTMLDivElement, TabViewInputProps>(
  ({ tabs, variant = 'default', size = 'md', fullWidth = false, children, activeIndex, defaultValue, onTabChange, className, ...props }, ref) => {
    const styles = variantStyles[variant]
    const sizes = sizeStyles[size]
    const fullWidthStyles = fullWidth ? 'flex-1 justify-center' : ''
    const navRef = useRef<HTMLDivElement>(null)
    const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 })

    const controlledValue =
      activeIndex !== undefined && tabs && tabs[activeIndex]
        ? resolveTabValue(tabs[activeIndex], activeIndex)
        : undefined

    const fallbackDefault = tabs?.[0] ? resolveTabValue(tabs[0], 0) : 'tab-0'
    const [internalValue, setInternalValue] = useState<string>(defaultValue ?? fallbackDefault)

    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue)
      }
    }, [controlledValue])

    const handleValueChange = useCallback(
      (value: string) => {
        setInternalValue(value)
        onTabChange?.(value)
      },
      [onTabChange],
    )

    const radixValue = controlledValue !== undefined ? controlledValue : internalValue

    const updatePill = useCallback(() => {
      if (variant !== 'pills') return
      const el = triggerRefs.current.get(radixValue)
      const nav = navRef.current
      if (!el || !nav) {
        setPillStyle((s) => ({ ...s, opacity: 0 }))
        return
      }
      const navRect = nav.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      setPillStyle({
        left: elRect.left - navRect.left,
        width: elRect.width,
        opacity: 1,
      })
    }, [radixValue, variant])

    useEffect(() => {
      updatePill()
      window.addEventListener('resize', updatePill)
      return () => window.removeEventListener('resize', updatePill)
    }, [updatePill])

    const renderTabHeader = (item: TabItemProps) => (
      <div className="flex items-center gap-[var(--spacing-sm)]">
        {item.icon && <span className={sizes.icon}>{item.icon}</span>}
        <span>{item.label}</span>
        {item.badge !== undefined && (
          <span
            className={cn(
              sizes.badge,
              'rounded-full font-medium bg-[var(--accent)] text-[var(--accent-foreground)]',
            )}
          >
            {item.badge}
          </span>
        )}
      </div>
    )

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <Tabs value={radixValue} onValueChange={handleValueChange}>
          <TabsList ref={navRef} className={styles.nav}>
            {variant === 'pills' && (
              <span
                aria-hidden
                className="liquid-glass-pill-active pointer-events-none absolute top-[var(--spacing-xs)] bottom-[var(--spacing-xs)] rounded-[var(--radius-sm)]"
                style={{
                  left: pillStyle.left,
                  width: pillStyle.width,
                  opacity: pillStyle.opacity,
                  transition:
                    'left var(--spring-duration-medium) var(--ease-spring-glide), width var(--spring-duration-medium) var(--ease-spring-glide), opacity var(--transition-fast)',
                }}
              />
            )}
            {tabs?.map((tab, index) => {
              const tabValue = resolveTabValue(tab, index)
              return (
                <TabsTrigger
                  key={tabValue}
                  value={tabValue}
                  disabled={tab.disabled}
                  ref={(node) => {
                    if (node) triggerRefs.current.set(tabValue, node)
                    else triggerRefs.current.delete(tabValue)
                  }}
                  className={cn(
                    styles.tab,
                    sizes.tab,
                    fullWidthStyles,
                    'flex items-center gap-[var(--spacing-sm)] outline-none',
                  )}
                >
                  {renderTabHeader(tab)}
                </TabsTrigger>
              )
            })}
            {!tabs && children}
          </TabsList>

          {tabs?.map((tab, index) => {
            const tabValue = resolveTabValue(tab, index)
            return (
              <TabsContent key={tabValue} value={tabValue} className={cn(styles.content, 'outline-none')}>
                {tab.children}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    )
  },
)

TabView.displayName = 'TabView'

export default TabView
