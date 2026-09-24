# STT Providers

| Provider | Español | Uso | Dependencias |
| --- | --- | --- | --- |
| `apple` | ✅ `es-MX` / `es-ES` | PTT en vivo + archivos | `electron-native-speech`, mic + Speech Recognition |
| `cloud` | ✅ Whisper API | Archivos | OpenRouter / 9router |
| `auto` | ✅ | Apple Speech → Cloud (archivos) | — |

## Apple Speech

Usa `SFSpeechRecognizer` vía `electron-native-speech` (helper `SpeechHelper.app`).

- Idioma: `stt.language` (`es` → `es-MX`)
- PTT: sesión de micrófono ~8 s tras el atajo
- Reuniones: `transcribeFile` con AVFoundation (wav, m4a, mp3…)
- Requiere macOS 13+ y permisos de **Micrófono** + **Reconocimiento de voz**

## IPC / settings

`settings.stt.provider`: `apple` | `cloud` | `auto`
