# Plan de mejoras — herramientas locales (sin LMCP)

Roadmap para ampliar el copilot con herramientas nativas macOS, inspirado en las capacidades de [LMCP](https://www.local-mcp.com/es) pero **sin integrar** `local-mcp` como dependencia (sin Fase 7).

**Stack:** `bridge/` (AppleScript) → `toolRegistry` / executor → Jev fast-path → UI con preview/confirm.

---

## Estado actual (baseline)

| Dominio | Cubierto hoy |
| --- | --- |
| Email | `fetchUnreadEmails`, `mailTriageInbox`, archivar junk |
| Notes / Reminders | `createNote`, `createReminder` |
| Sistema | `emptyTrash`, Music play/pause/next |
| Pantalla | Captura + visión LLM |
| Reuniones | Grabación STT + resumen → Notes |

---

## Fases

### Fase 0 — Fundación ✅

- [x] Catálogo de tools tipado (`src/main/agent/tools/catalog.ts`)
- [x] Patrón **preview → confirm** (`executor.ts`, `ToolPreviewCard`)
- [x] `runDiagnostics()` (`src/main/setup/diagnostics.ts`)
- [x] IPC: `diagnostics:run`, `tools:list`, `tools:confirm-preview`
- [x] UI: Ajustes → Sistema, paleta ⌘K

### Fase 1 — Email completo ✅

Replicar bloque Mail vía Mail.app:

| Tool interna | Equivalente LMCP |
| --- | --- |
| `mail_list_accounts` | `list_email_accounts` |
| `mail_list` | `list_emails` |
| `mail_read` | `read_email` |
| `mail_search` | `search_emails` |
| `mail_send` | `send_email` |
| `mail_reply` | `reply_email` |
| `mail_draft` | `create_draft` |
| `mail_move` | `move_email` |

- [x] `mailService.ts` ampliado (list, read, search, send, reply, draft, move, accounts)
- [x] Tools registradas en catálogo fase 1
- [x] Intents Jev: `mail_list`, `mail_search`, `mail_read` (+ triage existente)
- [x] Tarjetas `EmailListCard`, `EmailDetailCard` en chat
- [x] Envío/responder/mover con preview → confirm

### Fase 2 — Calendario + Contactos (2 semanas)

- `calendarService.ts` (EventKit o Calendar.app)
- `contactsService.ts`
- Tools: listar/crear/actualizar/cancelar eventos; buscar contactos
- Intents: `calendar_query`, `calendar_schedule`

### Fase 3 — Notes / Reminders completos (1 semana)

- Listar, buscar, leer, actualizar notas y recordatorios
- Completar / mover recordatorios entre listas

### Fase 4 — Briefing y workflows (1–2 semanas)

- Tool compuesta `daily_brief` (calendario + correo + recordatorios)
- Orchestrator multi-paso cuando Jev devuelve `complex`

### Fase 5 — Archivos y reuniones (2 semanas)

- `fileService`: Finder, lectura PDF/texto
- Transcripciones Zoom locales (`~/Documents/Zoom`)
- Contexto pre-reunión (asistentes + correos + archivos)

### Fase 6 — Mensajería local (3–4 semanas, opcional)

- iMessage read/search (SQLite Messages)
- Slack/Teams solo si hay demanda (alto coste sin LMCP)

---

## Fuera de alcance (explícito)

- Integración `npx local-mcp` / túnel cloud LMCP
- WhatsApp, Signal, M365 Graph, Office automation masiva
- Catálogo de 200+ tools marginales (stocks, VPN, ServiceNow, etc.)

---

## Prioridad 4 semanas (MVP herramientas)

| Semana | Entregable |
| --- | --- |
| 1 | Email: read/search/list + Jev |
| 2 | Email: send/draft con preview |
| 3 | Calendario: list + create |
| 4 | `daily_brief` + diagnóstico en onboarding |

---

## Arquitectura objetivo

```
src/main/
  agent/
    tools/
      catalog.ts      # definiciones + schemas
      executor.ts     # run + preview/confirm
      pendingStore.ts # acciones pendientes (TTL)
    toolRegistry.ts   # facade pública
    jev/              # intents → tools
  bridge/             # AppleScript / servicios OS
  setup/
    diagnostics.ts    # runDiagnostics()
```

**Regla:** acciones destructivas o salientes → preview en UI → `confirm` antes de ejecutar.

---

## Referencias

- [LMCP — sitio](https://www.local-mcp.com/es)
- [Bridge actual](src/main/bridge/README.md)
- [Agent layer](src/main/agent/README.md)
