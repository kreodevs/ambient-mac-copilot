# Setup Bootstrap

## Orden de configuración

1. **Proveedores** — `OPENROUTER_API_KEY` en entorno se importa cifrada al arrancar (si no existe en SQLite).
2. **Activación** — push-to-talk por defecto (`Command+Shift+V`). Picovoice opcional para wake word.
3. **Permisos** — micrófono vía `askForMediaAccess`; pantalla vía `desktopCapturer`; reconocimiento de voz vía `SFSpeechRecognizer.requestAuthorization` (SpeechHelper). Enlaces a Ajustes usan URLs de Ventura+ con fallback legacy. En dev, `scripts/patch-electron-plist.mjs` añade `NSSpeechRecognitionUsageDescription` al binario de Electron.
4. **Automatización** — macOS no lista la app hasta el primer `osascript` hacia Mail/Notes/Reminders. Usa `probeAutomationPermission()` en onboarding o al primer uso real.
4. **BlackHole + ffmpeg** — prerequisitos para reuniones estéreo.
5. **Diagnóstico** — `runDiagnostics()` en `diagnostics.ts` (Ajustes → Sistema o IPC `diagnostics:run`).
6. **Auto-updater** — `autoUpdater.ts` con `electron-updater` contra GitHub Releases (solo builds empaquetadas).
7. **Voice extras** — `voiceExtras.ts` descarga Kokoro/Picovoice desde GitHub Releases a `userData/voice-extras/` (no van en el DMG base).

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `OPENROUTER_API_KEY` | Proveedor `openrouter-main` |
| `PICOVOICE_ACCESS_KEY` | Wake word Porcupine (solo si `activationMode=wake-word`) |
