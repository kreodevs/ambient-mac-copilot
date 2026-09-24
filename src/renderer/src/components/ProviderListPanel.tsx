import { useState } from 'react'
import type { AppSettings, ProviderPreset, ProviderProfile } from '@shared/types'
import { Card } from '@/components/kreo/ui/Card'
import { Button } from '@/components/kreo/ui/Button'
import { InputText } from '@/components/kreo/ui/InputText'
import { Checkbox } from '@/components/kreo/ui/Checkbox'
import { Dialog } from '@/components/kreo/ui/Dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PRESET_URLS: Record<ProviderPreset, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  '9router': 'http://localhost:20128/v1',
  custom: '',
}

interface ProviderListPanelProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
}

export function ProviderListPanel({ settings, onUpdate }: ProviderListPanelProps) {
  const [editing, setEditing] = useState<ProviderProfile | null>(null)
  const [apiKey, setApiKey] = useState('')

  const openEditor = (provider: ProviderProfile) => {
    setEditing({ ...provider })
    setApiKey('')
  }

  const closeEditor = () => {
    setEditing(null)
    setApiKey('')
  }

  const saveProvider = async () => {
    if (!editing) return
    const providers = settings.providers.filter((p) => p.id !== editing.id)
    providers.push(editing)
    await onUpdate({ providers })
    if (apiKey) {
      await window.electronAPI.updateProviderSecret(editing.id, apiKey)
    }
    closeEditor()
    toast.success('Proveedor guardado')
  }

  const testProvider = async (id: string) => {
    const result = await window.electronAPI.testProviderConnection(id)
    if (result.ok) {
      toast.success(`Conexión OK${result.supportsSystemOne ? ' · System One' : ''}`)
    } else {
      toast.error(result.error ?? 'Error de conexión')
    }
  }

  const addProvider = () => {
    openEditor({
      id: `provider-${Date.now()}`,
      name: 'Nuevo proveedor',
      preset: 'custom',
      baseUrl: '',
      supportsSystemOne: false,
    })
  }

  const isNew = editing ? !settings.providers.some((p) => p.id === editing.id) : false

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex shrink-0 justify-end">
        <Button variant="ghost" size="sm" onClick={addProvider}>Añadir</Button>
      </div>

      <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
        {settings.providers.map((p) => (
          <Card
            key={p.id}
            bodyClassName="flex items-center justify-between gap-3"
            className={cn(
              'cursor-pointer transition-colors hover:bg-[var(--secondary)]',
              editing?.id === p.id && 'ring-1 ring-[var(--primary)]',
            )}
            onClick={() => openEditor(p)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="truncate text-xs text-[var(--foreground-muted)]">{p.baseUrl}</p>
              {p.apiKeyMasked && (
                <p className="text-xs text-[var(--foreground-muted)]">API key: ••••••••</p>
              )}
            </div>
            <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => openEditor(p)}>Editar</Button>
              <Button variant="ghost" size="sm" onClick={() => testProvider(p.id)}>Test</Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog
        visible={!!editing}
        onHide={closeEditor}
        title={isNew ? 'Nuevo proveedor' : `Editar ${editing?.name ?? 'proveedor'}`}
        description="Gateway compatible con OpenAI (base URL + API key)."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeEditor}>Cancelar</Button>
            <Button onClick={saveProvider}>Guardar</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <InputText
              fullWidth
              label="Nombre"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <div className="mac-form-field">
              <label className="mac-form-label">Preset</label>
              <select
                className="mac-form-select"
                value={editing.preset}
                onChange={(e) => {
                  const preset = e.target.value as ProviderPreset
                  setEditing({
                    ...editing,
                    preset,
                    baseUrl: PRESET_URLS[preset] || editing.baseUrl,
                  })
                }}
              >
                <option value="openrouter">OpenRouter</option>
                <option value="9router">9router</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <InputText
              fullWidth
              label="Base URL"
              value={editing.baseUrl}
              onChange={(e) => setEditing({ ...editing, baseUrl: e.target.value })}
            />
            <InputText
              fullWidth
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editing.apiKeyMasked ? '••••••••' : ''}
            />
            <Checkbox
              label="Soporta System One (Jev)"
              checked={editing.supportsSystemOne}
              onChange={(checked) => setEditing({ ...editing, supportsSystemOne: checked })}
            />
          </div>
        )}
      </Dialog>
    </div>
  )
}
