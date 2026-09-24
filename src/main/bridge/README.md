# OS Bridge

Integraciones macOS vía AppleScript (`osascript.ts`).

| Servicio | Funciones |
| --- | --- |
| `mailService` | list/search/read/send/reply/draft/move, triage, accounts |
| `notesService` | Notes + Reminders |
| `mediaService` | Music.app play/pause/next |
| `systemService` | empty trash, maintenance |

## Permisos

Mail, Notes y Reminders requieren **Automatización** en Preferencias del Sistema. La app solo aparece en esa lista tras el primer intento (`probeAutomationPermission` en onboarding o uso real). En dev figura como **Electron**.

## Seguridad

`escapeAppleScriptString()` sanitiza inputs interpolados.
