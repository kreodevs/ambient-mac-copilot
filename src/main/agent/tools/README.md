# Agent tools

Catálogo tipado y ejecución con **preview → confirm** para acciones sensibles.

## Archivos

| Archivo | Rol |
| --- | --- |
| `catalog.ts` | Definiciones de tools (fase 0 implementadas, fase 1+ planificadas) |
| `types.ts` | `ToolDefinition`, `ToolRunResult`, `ToolPreviewPayload` |
| `executor.ts` | `executeTool`, `confirmToolPreview` |
| `pendingStore.ts` | Previews pendientes (TTL 10 min) |

## Preview / confirm

Tools con `requiresConfirmation: true` devuelven `status: 'preview'` hasta que el usuario confirme vía IPC `tools:confirm-preview`.

Hoy aplica a:

- `manage_system` con `action: empty_trash`
- `create_reminder_note`

## Roadmap

Ver [PLAN_MEJORAS.md](../../../../PLAN_MEJORAS.md) en la raíz del repo.
