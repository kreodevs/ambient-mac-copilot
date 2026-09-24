import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '@shared/types'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const s = await window.electronAPI.getSettings()
    setSettings(s)
  }, [])

  useEffect(() => {
    load()
    return window.electronAPI.onSettingsSync(setSettings)
  }, [load])

  const update = useCallback(
    async (partial: Partial<AppSettings>) => {
      setSaving(true)
      try {
        await window.electronAPI.updateSettings(partial)
        await load()
      } finally {
        setSaving(false)
      }
    },
    [load],
  )

  return { settings, saving, update, reload: load }
}
