# Config Layer

## settingsStore.ts

Facade sobre SQLite: proveedores, agent bindings, STT/TTS/audio prefs.

- `getSettings()` — secretos enmascarados
- `updateSettings(partial)` — valida y emite `settings:changed`
- `updatePicovoiceKey()` — cifrado en `app_secrets`

## providerRegistry.ts

- `getLLMClientForAgent(agentId)` — cliente OpenAI-compatible por binding
- `resolveSystemOneUrl(providerId)` — URL Jev System One
- Cache de clientes reconstruido en hot-reload
