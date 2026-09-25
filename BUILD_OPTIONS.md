# Opciones de build para macOS

Este proyecto tiene dos caminos de distribución: **self-signed / ad hoc** (interno) y **Apple Developer** (público).

## 1) Build interno self-signed (default)

### Empaquetado y firma

El flujo completo está en [`scripts/release-local.sh`](scripts/release-local.sh) y hace:

```bash
npm run build:local-cert   # 1 sola vez: crea un certificado self-signed "Ambient Copilot"
npm run release:local      # build + firma + genera DMG/ZIP y latest-mac.yml
```

`release:local` orquesta, en orden correcto:

1. **Limpia `release/`** para no publicar artefactos viejos.
2. **Empaqueta la app** (`electron-builder --mac --dir`) **sin archivos** (`sign: false`).
3. **Firma la app** con [`scripts/sign-app.sh`](scripts/sign-app.sh):
   - binarios nativos (`*.node`, `*.dylib`) en `app.asar.unpacked`;
   - `SpeechHelper.app` embebidas (Resources y asar.unpacked);
   - helpers de Electron con [`build/entitlements.helper.mac.plist`](build/entitlements.helper.mac.plist) (sin cámara);
   - frameworks y binarios internos;
   - ejecutable y bundle principal con [`build/entitlements.mac.plist`](build/entitlements.mac.plist);
   - verifica con `codesign --verify --deep --strict`.
4. **Genera DMG + ZIP + `latest-mac.yml`** `--prepackaged` a partir del `.app` YA firmado.

> El punto clave de integridad: **la firma ocurre ANTES de generar los archivos finales**, de modo que el DMG/ZIP y los metadatos de `electron-updater` contienen la app firmada.

### Firma ad hoc como respaldo

Si no existe el certificado `Ambient Copilot`, `sign-app.sh` usa firma **ad hoc** (`-`). Sirve para desarrollo, pero los helpers no reciben entitlements en ese modo.

### Entitlements

- App principal: [`build/entitlements.mac.plist`](build/entitlements.mac.plist) (JIT, memoria ejecutable, librerías, audio del micrófono, Apple Events).
- Helpers de Electron: [`build/entitlements.helper.mac.plist`](build/entitlements.helper.mac.plist) — set más reducido, **sin cámara** (menor privilegio).

### Limitación de Gatekeeper (IMPORTANTE)

Un certificado **self-signed** es criptográficamente válido (`codesign` pasa), pero macOS **lo rechaza con Gatekeeper** por no estar emitido por Apple:

```text
release/mac-arm64/Ambient Mac Copilot.app: valid on disk
release/mac-arm64/Ambient Mac Copilot.app: rejected   # origin=Ambient Copilot
```

Esto **no es un fallo del pipeline**, es inherente a un identity self-signed. Para instalar en una máquina de destino hay que **desplegar la confianza manualmente**:

- abrir con clic derecho → **Abrir**, y confirmar en *Ajustes > Privacidad y seguridad*;
- o **gestionar la confianza** (`spctl`/certificado raíz en *Accesorios > Visor de certificados*);
- o desplegar el perfil/certificado mediante **MDM** en despliegues controlados.

También **quítale la cuarentena** al `.app` local con:

```bash
xattr -dr com.apple.quarantine "release/mac-arm64/Ambient Mac Copilot.app"
```

(`release-local.sh` ya lo hace sobre la copia local; no afecta a los `.zip`/`.dmg` distribuidos).

## 2) Build profesional Apple (público)

Solo válido para distribución a usuarios finales. Requiere **Apple Developer ID** + notarización:

```bash
npm run build:apple        # o npm run release:mac
```

Qué hace:
- usa `electron-builder.yml` (firmado con certificado Apple Developer);
- ejecuta la notarización en [`build/notarize.js`](build/notarize.js);
- es la única vía con la que Gatekeeper no bloquea la app.

## Recomendación

- Usa `npm run release:local` para pruebas internas y despliegues controlados (MDM / confianza manual).
- Para distribución pública o amplia, usa **Developer ID + notarización** (opción Apple), no self-signed.
