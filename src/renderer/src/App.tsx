import { useCallback, useEffect, useState } from 'react'
import { Toaster, toast } from '@/components/kreo/ui/Sonner'
import { GlassShell } from '@/components/kreo/GlassShell'
import { SegmentedControl } from '@/components/kreo/ui/SegmentedControl'
import { CopilotStatusPill } from '@/components/kreo/CopilotStatusPill'
import { ChatPanel } from '@/components/ChatPanel'
import { SettingsPanel } from '@/components/SettingsPanel'
import { OnboardingWizard } from '@/components/OnboardingWizard'
import { WindowPinButton } from '@/components/WindowPinButton'
import { CommandPalette } from '@/components/CommandPalette'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useSettings } from '@/hooks/useSettings'
import { useAgentIPC } from '@/hooks/useAgentIPC'
import type { CopilotState } from '@shared/types'

export default function App() {
  const [tab, setTab] = useState('chat')
  const [settingsSection, setSettingsSection] = useState('providers')
  const [state, setState] = useState<CopilotState>('INITIALIZING')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { settings, saving, update } = useSettings()
  const agent = useAgentIPC()

  useEffect(() => {
    window.electronAPI.getOnboardingStatus().then((s) => {
      if (!s.completed) setShowOnboarding(true)
    })
    return window.electronAPI.onStateChange(setState)
  }, [])

  useEffect(() => {
    const unsubSettings = window.electronAPI.onOpenSettings?.(() => {
      setTab('settings')
      setSettingsSection('providers')
    })
    const unsubOnboarding = window.electronAPI.onOpenOnboarding?.(() => setShowOnboarding(true))
    return () => {
      unsubSettings?.()
      unsubOnboarding?.()
    }
  }, [])

  useEffect(() => {
    return window.electronAPI.onMeetingStatusUpdate((data) => {
      if (data.status === 'recording') toast.info('Grabando reunión…')
      if (data.status === 'complete') toast.success('Minuta guardada en Notes')
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const goToSettings = useCallback((section: string) => {
    setTab('settings')
    setSettingsSection(section)
  }, [])

  const togglePin = useCallback(() => {
    update({ windowPinned: !settings?.windowPinned })
  }, [settings?.windowPinned, update])

  return (
    <GlassShell className="mac-window">
      <header className="mac-toolbar mac-titlebar app-window-drag">
        <SegmentedControl
          aria-label="Sección principal"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'chat', label: 'Chat' },
            { value: 'settings', label: 'Ajustes' },
          ]}
        />
        <div className="app-window-no-drag flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-7 rounded-[var(--radius-sm)] px-2 text-xs text-[var(--foreground-muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)] sm:inline-flex"
            title="Paleta de comandos (⌘K)"
          >
            ⌘K
          </button>
          <WindowPinButton
            pinned={!!settings?.windowPinned}
            disabled={!settings || saving}
            onToggle={togglePin}
          />
          <CopilotStatusPill state={state} />
        </div>
      </header>

      <UpdateBanner />

      <main className={tab === 'chat' ? 'mac-content p-3' : 'mac-content'}>
        {tab === 'chat' ? (
          <ChatPanel
            threads={agent.threads}
            activeThreadId={agent.activeThreadId}
            messages={agent.messages}
            loading={agent.loading}
            sendMessage={agent.sendMessage}
            createThread={agent.createThread}
            switchThread={agent.switchThread}
          />
        ) : (
          <SettingsPanel section={settingsSection} onSectionChange={setSettingsSection} />
        )}
      </main>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        pinned={!!settings?.windowPinned}
        onGoToChat={() => setTab('chat')}
        onGoToSettings={goToSettings}
        onTogglePin={togglePin}
        onNewThread={agent.createThread}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onRunDiagnostics={() => goToSettings('system')}
      />

      <Toaster position="top-center" richColors />

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </GlassShell>
  )
}
