# Command Activation

Capa desacoplada para activar comandos de voz. El modo se elige en Ajustes → Audio.

## Proveedores

| Modo | Clase | Requisitos |
| --- | --- | --- |
| `push-to-talk` | `PushToTalkProvider` | Atajo global (Electron `globalShortcut`) |
| `wake-word` | `PicovoiceWakeWordProvider` | Picovoice Access Key + wake word |
| `none` | — | Desactivado |

## Uso en main

```typescript
import { commandActivation } from './audio/activation/CommandActivationManager.js'

commandActivation.init(() => handleCommand())
await commandActivation.start()

// Durante comando o reunión:
commandActivation.pause()
await commandActivation.resume()
```

## Añadir un proveedor

1. Implementar `CommandActivationProvider` en `types.ts`.
2. Registrar en `createActivationProvider.ts`.
3. Añadir el valor al tipo `ActivationMode` y a la UI de Ajustes.
