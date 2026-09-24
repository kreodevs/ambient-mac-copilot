# Main process

Electron main entry: window, tray, shortcuts, IPC, audio, and agent orchestration.

## Ventana y bandeja

- La app es **solo bandeja** (`LSUIElement`): no aparece en el Dock.
- Al hacer clic fuera de la ventana (o perder el foco), se **oculta** — excepto durante el onboarding.
- **Mostrar / ocultar:** `⌘⇧Space` o clic en el ícono de la barra de menú.
- **Ajustes:** `⌘,` o menú contextual de la bandeja.
- Ícono de bandeja: `build/tray-icon.png` (ondas ambientales + destello), cargado por `trayIcon.ts`. Regenerar con `npm run icons`.

## Desarrollo

Tras cambios en `src/main/`, reinicia `npm run dev` para que el proceso principal recargue.
