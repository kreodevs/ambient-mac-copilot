import { IMPLEMENTED_PHASE, listToolCatalog, TOOL_CATALOG } from './tools/catalog.js'
import { confirmToolPreview, executeTool } from './tools/executor.js'
import type { ToolExecuteOptions, ToolRunResult } from './tools/types.js'

/** @deprecated Usar listToolCatalog() — se mantiene por compatibilidad. */
export const AGENT_TOOLS = TOOL_CATALOG.filter((t) => t.phase <= IMPLEMENTED_PHASE).map((t) => ({
  name: t.name,
  description: t.description,
}))

export type ToolName = (typeof AGENT_TOOLS)[number]['name']

export { listToolCatalog, confirmToolPreview, executeTool }
export type { ToolRunResult, ToolExecuteOptions }
