export type ToolRisk = 'read' | 'write' | 'destructive' | 'outbound'

export interface ToolDefinition {
  name: string
  description: string
  /** Fase en la que se implementa (0 = ya disponible). */
  phase: number
  risks: ToolRisk[]
  requiresConfirmation: boolean
  /** Parámetros documentados (JSON-schema ligero). */
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export interface ToolPreviewPayload {
  tool: string
  summary: string
  args: Record<string, unknown>
  risks: string[]
  expiresAt: number
}

export type ToolRunResult =
  | {
      status: 'ok'
      result: unknown
      reply: string
      actionData?: unknown
    }
  | {
      status: 'preview'
      previewId: string
      preview: ToolPreviewPayload
      reply: string
      actionData?: unknown
    }
  | {
      status: 'error'
      error: string
      reply: string
    }

export interface ToolExecuteOptions {
  confirm?: boolean
  previewId?: string
}
