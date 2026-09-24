# TTS Providers

| Provider | Default | Español | Notas |
| --- | --- | --- | --- |
| `macos` | ✅ Monica | ✅ | `say` + `afplay`, sin modelos |
| `kokoro` | — | ⏳ `ef_dora` | ONNX local; voces ES cuando kokoro-js las publique |

## Settings

- `tts.macosVoice` — p. ej. `Monica`, `Paulina`, `Jorge`
- `tts.kokoroVoice` — p. ej. `ef_dora` (es), `af_bella` (en fallback)
- `tts.outputDeviceId` — `headphones-preferred` por defecto

Kokoro hace fallback a macOS say si el modelo no carga o falla la síntesis.
