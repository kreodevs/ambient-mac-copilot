/// <reference types="vite/client" />

import type { ElectronAPI } from '@shared/types'

declare global {
  interface Window {
    electronAPI: ElectronAPI & {
      onOpenSettings?: () => () => void
      onOpenOnboarding?: () => () => void
      warmupModels?: () => Promise<{ ok: boolean; error?: string }>
    }
  }
}
