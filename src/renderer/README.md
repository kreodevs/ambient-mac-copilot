# Renderer

UI React con tema **macOS nativo** (materiales, segmented control, sidebar) alineado a Ajustes del Sistema. Tokens en `src/theme/`; componentes Kreo en `src/components/kreo/`.

## design-direction.md

Referencias de diseño y mapeo de tokens Inspo → Kreo `--*`.

## Componentes

| UI | Componente |
| --- | --- |
| Shell | `Command` |
| Tabs | `TabView` |
| Chat | `ChatPanel`, `ChatHistory` (indicador de carga), `ThreadListPanel` (scroll) |
| Settings | `SettingsPanel` (sidebar izq. + contenido der.), `ProviderListPanel` (edición en diálogo), `AgentBindingsPanel` |
| Onboarding | `OnboardingWizard` (barra superior y fondo arrastrables) |
| Ventana | `WindowPinButton` + menú bandeja «Mantener visible» |
| Comandos | `CommandPalette` — paleta ⌘K (navegación, hilos, pin) |
| Barra | `SegmentedControl` — Chat / Ajustes |
| Cards | `MailTriageCard`, `MeetingSummaryCard` |
| Toasts | Sonner |

## Hooks

- `useAgentIPC` — chat, threads, state machine
- `useSettings` — CRUD settings vía IPC

## Kreo MCP

Cuando `kreo` MCP esté configurado, reemplazar componentes locales con `pull_source_code_from_registry`.
