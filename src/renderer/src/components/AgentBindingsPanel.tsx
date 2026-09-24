import type { AgentId, AppSettings } from '@shared/types'
import { Card } from '@/components/kreo/ui/Card'
import { Button } from '@/components/kreo/ui/Button'
import { InputText } from '@/components/kreo/ui/InputText'
import { Checkbox } from '@/components/kreo/ui/Checkbox'
import { toast } from 'sonner'

const AGENT_LABELS: Record<AgentId, string> = {
  orchestrator: 'Orchestrator',
  jev: 'Jev Router',
  screenVision: 'Screen Vision',
  meetingSummarizer: 'Meeting Summarizer',
  cloudStt: 'Cloud STT',
}

interface AgentBindingsPanelProps {
  settings: AppSettings
  onUpdate: (partial: Partial<AppSettings>) => Promise<void>
}

export function AgentBindingsPanel({ settings, onUpdate }: AgentBindingsPanelProps) {
  const updateAgent = async (agentId: AgentId, field: string, value: string | boolean) => {
    const agents = { ...settings.agents }
    agents[agentId] = { ...agents[agentId], [field]: value }
    await onUpdate({ agents })
  }

  const testAgent = async (agentId: AgentId) => {
    const result = await window.electronAPI.testAgent(agentId)
    if (result.ok) toast.success(`${AGENT_LABELS[agentId]} OK`)
    else toast.error(result.error ?? 'Test fallido')
  }

  const jevProviders = settings.providers.filter((p) => p.supportsSystemOne)

  return (
    <div className="space-y-3">
      {(Object.keys(AGENT_LABELS) as AgentId[]).map((agentId) => {
        const binding = settings.agents[agentId]
        const providers = agentId === 'jev' ? jevProviders : settings.providers
        const warnJev = agentId === 'jev' && jevProviders.length === 0

        return (
          <Card key={agentId} bodyClassName="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{AGENT_LABELS[agentId]}</span>
              <Button variant="ghost" size="sm" onClick={() => testAgent(agentId)}>Test</Button>
            </div>

            <div className="mac-form-field">
              <label className="mac-form-label">Proveedor</label>
              <select
                className="mac-form-select"
                value={binding.providerId}
                onChange={(e) => updateAgent(agentId, 'providerId', e.target.value)}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <InputText
              fullWidth
              label="Modelo"
              value={binding.model}
              onChange={(e) => updateAgent(agentId, 'model', e.target.value)}
            />

            {agentId === 'jev' && (
              <Checkbox
                label="Activo"
                checked={binding.enabled}
                disabled={warnJev}
                onChange={(checked) => updateAgent(agentId, 'enabled', checked)}
              />
            )}

            {warnJev && (
              <p className="text-xs text-[var(--warning)]">
                Jev requiere un proveedor con System One habilitado.
              </p>
            )}
          </Card>
        )
      })}
    </div>
  )
}
