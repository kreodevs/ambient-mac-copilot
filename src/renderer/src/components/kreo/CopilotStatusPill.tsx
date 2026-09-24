import type { CopilotState } from '@shared/types'
import { StatusPill } from './ui/StatusPill'

const STATE_MAP: Record<CopilotState, { status: 'success' | 'warning' | 'info' | 'neutral' | 'error'; label: string }> = {
  INITIALIZING: { status: 'warning', label: 'Iniciando' },
  FOCUS_IDLE: { status: 'success', label: 'Listo' },
  COMMAND_ACTIVE: { status: 'info', label: 'Comando activo' },
  MEETING_MODE: { status: 'neutral', label: 'Reunión' },
  POST_PROCESSING: { status: 'warning', label: 'Procesando' },
}

interface CopilotStatusPillProps {
  state: string
}

export function CopilotStatusPill({ state }: CopilotStatusPillProps) {
  const mapped = STATE_MAP[state as CopilotState] ?? { status: 'neutral' as const, label: state }
  return <StatusPill status={mapped.status}>{mapped.label}</StatusPill>
}
