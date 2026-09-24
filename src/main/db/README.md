# Database Layer

SQLite (`userData/copilot.db`) con `better-sqlite3` en el main process.

## Schema

- `providers` — perfiles LLM (sin secretos)
- `provider_secrets` — `api_key_enc` cifrado AES-256-GCM
- `app_secrets` — Picovoice key, etc.
- `app_preferences` — JSON de settings (agentes, STT/TTS, audio)
- `chat_threads` / `chat_messages` — historial multihilo

## Cifrado

1. Master key 32 bytes → `safeStorage` (Keychain macOS)
2. Cada secreto: IV (12) + tag (16) + ciphertext
3. Renderer solo ve `apiKeyMasked: true`

## Migraciones

Archivos en `migrations/` aplicados automáticamente al arrancar.
