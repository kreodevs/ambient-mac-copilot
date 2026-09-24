# Audio Pipeline

## Grabación estéreo de reuniones

```
ffmpeg -f avfoundation -i ":0" -f avfoundation -i ":{blackholeIndex}" \
  -filter_complex "[0:a][1:a]amerge=inputs=2[aout]" -map "[aout]" \
  -ac 2 -ar 16000 meeting_<ts>.wav
```

| Canal | Fuente |
| --- | --- |
| Left (0) | Micrófono |
| Right (1) | BlackHole loopback |

## BlackHole setup

1. Instalar [BlackHole 2ch](https://existential.audio/blackhole/)
2. Audio MIDI Setup → crear **Multi-Output Device** (Built-in Output + BlackHole)
3. Seleccionar Multi-Output como salida del sistema
4. Configurar `audio.blackholeDeviceIndex` en Ajustes

## Activación de comandos

Modo configurable en Ajustes → Audio (`audio.activationMode`):

| Modo | Descripción |
| --- | --- |
| `push-to-talk` | Atajo global (`Command+Shift+V` por defecto) |
| `wake-word` | Picovoice Porcupine (requiere Access Key) |
| `none` | Desactivado |

Ver [`activation/README.md`](./activation/README.md) para la arquitectura de proveedores.

## STT / TTS

- **Apple Speech** — `SFSpeechRecognizer` local, español (`es-MX`), sin modelos extra
- **Cloud STT** — Whisper vía OpenRouter / 9router
- **macOS say** — default (`Monica`), español nativo
- **Kokoro** — ONNX opcional, cache en `userData/kokoro/`

Ver [`stt/README.md`](./stt/README.md) y [`tts/README.md`](./tts/README.md).

## Salida TTS

`headphones-preferred` detecta Bluetooth/USB headset antes que altavoces built-in.
