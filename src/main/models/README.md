# Model Manager

Descarga y cachea el modelo TTS local en primer uso.

| Modelo | Cache | Uso |
| --- | --- | --- |
| Kokoro TTS | `userData/kokoro/` | Respuestas por audífonos |

STT local usa **Apple Speech** (sin modelos que descargar).

## IPC

- `models:warmup` — descarga Kokoro con progreso (`models:download-progress`)
- `models:get-status` — estado persistido en `app_preferences.models_status`

## CLI (sin abrir la app)

```bash
node scripts/warmup-models.mjs
```

## Permisos requeridos

- **Micrófono** — push-to-talk y STT
- **Reconocimiento de voz** — Apple Speech
- **Screen Recording** — análisis de pantalla (`desktopCapturer`)
