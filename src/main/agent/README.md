# Agent Layer

## Módulos

| Archivo | Rol |
| --- | --- |
| `orchestrator.ts` | Loop principal chat + Jev fast-path |
| `jev/jevRouter.ts` | Clasificación de intención vía Jev Decisions API |
| `jev/jevDecisions.ts` | Cliente `POST /api/alpha/decisions` (modelos `~typesafe/jev-*`) |
| `tools/` | Catálogo, executor, preview/confirm |
| `toolRegistry.ts` | Facade pública sobre `tools/executor` |
| `contextStore.ts` | Facade SQLite threads/messages |
| `meetingSummarizer.ts` | Minutas post-reunión → Notes |

## Jev fast-path

Si `confidence >= jev.minConfidence` y hay tool mapeado → ejecuta sin LLM completo.

Los modelos Jev (`~typesafe/jev-latest`) **no** usan `chat/completions`; van al endpoint
`/api/alpha/decisions` de OpenRouter con una pregunta `choice` sobre las intenciones definidas
en `intentPlaybooks.ts`.

## Context store

Hilo por defecto: `general`. El orchestrator carga últimos N mensajes como contexto.
