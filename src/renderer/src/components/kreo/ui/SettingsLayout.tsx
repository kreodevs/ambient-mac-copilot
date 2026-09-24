import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export interface SettingsNavItem {
  label: string
  href: string
  icon: LucideIcon
  description?: string
}

export interface SettingsLayoutProps {
  navigationItems: SettingsNavItem[]
  contentTitle?: string
  contentSubtitle?: string
  activeHref?: string
  onNavigate?: (href: string) => void
  children: ReactNode
  className?: string
}

/**
 * Layout tipo Ajustes del Sistema: sidebar fijo a la izquierda, contenido a la derecha.
 */
export const SettingsLayout = forwardRef<HTMLDivElement, SettingsLayoutProps>(
  (
    {
      navigationItems,
      contentTitle,
      contentSubtitle,
      activeHref,
      onNavigate,
      children,
      className,
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cn('mac-settings-layout flex h-full min-h-0', className)}>
        <aside className="mac-sidebar mac-settings-sidebar flex w-[152px] shrink-0 flex-col py-2 pl-2 pr-1">
          <nav className="flex flex-col gap-0.5" aria-label="Secciones de ajustes">
            {navigationItems.map((item) => {
              const isActive = activeHref === item.href
              const Icon = item.icon

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onNavigate?.(item.href)}
                  className={cn(
                    'mac-settings-nav-item app-window-no-drag flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition-colors',
                    isActive
                      ? 'bg-[var(--mac-segment-selected)] text-[var(--foreground)]'
                      : 'text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-[var(--primary)]' : 'text-[var(--foreground-subtle)]',
                    )}
                  />
                  <span className="truncate text-[13px] font-medium leading-tight">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="mac-settings-content min-h-0 min-w-0 flex-1 overflow-y-auto">
          {(contentTitle || contentSubtitle) && (
            <header className="mac-settings-header shrink-0 border-b border-[var(--border)] px-5 pb-3 pt-4">
              {contentTitle && (
                <h1 className="text-[22px] font-semibold tracking-tight text-[var(--foreground)]">
                  {contentTitle}
                </h1>
              )}
              {contentSubtitle && (
                <p className="mt-0.5 text-[13px] text-[var(--foreground-muted)]">{contentSubtitle}</p>
              )}
            </header>
          )}

          <div className="mac-settings-body px-5 py-4">{children}</div>
        </main>
      </div>
    )
  },
)

SettingsLayout.displayName = 'SettingsLayout'
