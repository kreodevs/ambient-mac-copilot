# Kreo Components (local bootstrap)

Implementación local con estilo **Liquid Glass** (`src/theme/liquid-glass.css`).

## Componentes

- `Command` — shell spotlight
- `StatusPill` — estado de la máquina
- `Card`, `Button`, `InputText` — primitives
- `TabView` — tabs con paneles (settings internos)
- `SegmentedControl` — Chat | Ajustes en la barra superior
- `Command` — paleta ⌘K (`CommandPalette`)
- `SettingsLayout` — sidebar izquierda + contenido derecha (patrón Ajustes del Sistema)

## Tokens

Definidos en `src/theme/vars.css` + utilidades en `src/theme/liquid-glass.css`.

## Migración a Kreo MCP

1. `pull_registry_theme_css({ preset: "glass" })`
2. `pull_source_code_from_registry` por componente
3. Actualizar imports a `@/components/{layer}/{Name}`
