import { randomUUID } from 'node:crypto'
import type { ToolPreviewPayload } from './types.js'

const TTL_MS = 10 * 60 * 1000

type PendingEntry = {
  tool: string
  args: Record<string, unknown>
  preview: ToolPreviewPayload
  createdAt: number
}

const pending = new Map<string, PendingEntry>()

function purgeExpired(): void {
  const now = Date.now()
  for (const [id, entry] of pending) {
    if (entry.preview.expiresAt <= now) pending.delete(id)
  }
}

export function createPendingPreview(
  tool: string,
  args: Record<string, unknown>,
  preview: Omit<ToolPreviewPayload, 'expiresAt'>,
): { previewId: string; preview: ToolPreviewPayload } {
  purgeExpired()
  const previewId = randomUUID()
  const full: ToolPreviewPayload = {
    ...preview,
    expiresAt: Date.now() + TTL_MS,
  }
  pending.set(previewId, { tool, args, preview: full, createdAt: Date.now() })
  return { previewId, preview: full }
}

export function consumePendingPreview(
  previewId: string,
): { tool: string; args: Record<string, unknown> } | null {
  purgeExpired()
  const entry = pending.get(previewId)
  if (!entry) return null
  if (entry.preview.expiresAt <= Date.now()) {
    pending.delete(previewId)
    return null
  }
  pending.delete(previewId)
  return { tool: entry.tool, args: entry.args }
}

export function clearPendingPreviews(): void {
  pending.clear()
}
