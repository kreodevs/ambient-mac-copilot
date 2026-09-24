# Build assets

Recursos de empaquetado y marca para **Ambient Mac Copilot**.

## Iconos

| Archivo | Uso |
| --- | --- |
| `icons/app-icon.svg` | Fuente vectorial del ícono de app |
| `icons/tray-icon.svg` | Fuente vectorial del ícono de bandeja (template monocromo) |
| `icon.png` / `icon.icns` / `icon.ico` | Ícono de aplicación (electron-builder) |
| `tray-icon.png` | Ícono de barra de menú (proceso principal) |

## Releases

`electron-builder.yml` publica en `kreodevs/ambient-mac-copilot`. El `.dmg` es instalación manual; el `.zip` lo usa el auto-updater.

Regenerar iconos:

```bash
npm run icons
```

Requisitos: Python 3, ImageMagick (`magick`) y `iconutil` (macOS). Los SVG en `icons/` documentan el diseño; el render final lo hace `scripts/generate_icons.py`.

### Diseño

- **App:** gradiente azul cielo (tema liquid glass), orbe de vidrio, ecualizador de voz y destello de copilot.
- **Bandeja:** ecualizador simplificado + punto + destello; negro sobre transparente para `setTemplateImage(true)` en macOS.
