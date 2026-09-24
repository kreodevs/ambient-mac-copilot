# Theme — Liquid Glass

Estilo visual inspirado en **Liquid Glass** (macOS): capas translúcidas, blur fuerte, bordes luminosos y brillo especular.

## Archivos

| Archivo | Rol |
| --- | --- |
| `vars.css` | Tokens Kreo (`--primary`, `--card`, spacing, radius) |
| `liquid-glass.css` | Utilidades `.liquid-glass-*` |

## Clases principales

- `.mac-window` / `.mac-toolbar` / `.mac-sidebar` / `.mac-settings-*` — layout tipo Ajustes del Sistema
- `.mac-form-field` / `.mac-form-select` — campos de formulario consistentes
- `.mac-inline-card` — bloques embebidos en chat (sin doble cromo)
- `.mac-segmented` — control segmentado estilo macOS
- `.mac-dialog` — hoja modal opaca (Dialog)
- `.app-window-drag` / `.app-window-no-drag` — zonas arrastrables (ventana `hiddenInset`)
- `.liquid-glass-subtle` — tarjetas, nav activo, inputs secundarios
- `.liquid-glass-input` — campos de texto y selects
- `.liquid-glass-pill` / `.liquid-glass-pill-active` — tabs y botones primarios
- `.liquid-glass-ambient` — orbes de color detrás de la ventana
- `.liquid-glass-overlay` — modales y onboarding

Importado desde `src/styles/index.css`.
