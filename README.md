<p align="center">
  <img src="build/icon.png" alt="Ambient Mac Copilot" width="96" height="96" />
</p>

<h1 align="center">Ambient Mac Copilot</h1>

<p align="center">
  Asistente ambient para macOS: chat multihilo, voz local, automatización del sistema y reuniones con resumen automático.
</p>

<p align="center">
  <a href="https://github.com/kreodevs/ambient-mac-copilot/releases"><img src="https://img.shields.io/github/v/release/kreodevs/ambient-mac-copilot?label=release" alt="Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License AGPL-3.0" /></a>
  <a href="https://github.com/kreodevs/ambient-mac-copilot/actions"><img src="https://img.shields.io/github/actions/workflow/status/kreodevs/ambient-mac-copilot/release.yml?label=CI" alt="CI" /></a>
</p>

---

## ¿Qué es?

**Ambient Mac Copilot** vive en la barra de menú de macOS. Aparece con `⌘⇧Space`, responde por chat o voz, automatiza Mail/Notes/Reminders y puede grabar reuniones para generar minutas.

| Capacidad | Descripción |
| --- | --- |
| **Chat multihilo** | Conversaciones persistentes con contexto local (SQLite) |
| **Voz local** | STT con Apple Speech, TTS con macOS say (por defecto) |
| **Extras opcionales** | Kokoro TTS y Picovoice se descargan desde Ajustes |
| **Wake word** | Picovoice (opcional, instalación bajo demanda) |
| **Correo** | Listar, buscar, leer y enviar vía Mail.app |
| **Reuniones** | Grabación estéreo (mic + sistema) y resumen en Notes |
| **Routing Jev** | Clasificación rápida de intenciones antes del orchestrator |
| **Actualizaciones** | Aviso automático cuando hay una nueva versión en GitHub |

## Instalación

### Descarga (recomendado para pruebas)

1. Ve a [**Releases**](https://github.com/kreodevs/ambient-mac-copilot/releases).
2. Descarga el `.dmg` más reciente.
3. Arrastra **Ambient Mac Copilot** a Aplicaciones.
4. Abre la app y completa el asistente de configuración.

La app comprueba actualizaciones al iniciar y cada pocas horas. Si hay una versión nueva, te preguntará si quieres descargarla e instalarla.

### Requisitos del sistema

| Dependencia | Propósito |
| --- | --- |
| **macOS 13+** | Apple Silicon o Intel |
| **BlackHole 2ch** | Loopback de audio para reuniones |
| **ffmpeg** | Grabador estéreo (`brew install ffmpeg`) |
| **Picovoice Access Key** | Solo si instalas wake word desde Ajustes |
| **LLM gateway** | OpenRouter, 9router, Ollama u otro compatible OpenAI |

### Permisos macOS

Al primer uso, concede:

- Micrófono
- Reconocimiento de voz
- Screen Recording (análisis de pantalla)
- **Automatización** → Mail, Notes, Reminders

> En desarrollo la app aparece como **Electron**. En la build empaquetada aparece como **Ambient Mac Copilot**.

## Atajos

| Atajo | Acción |
| --- | --- |
| `⌘⇧Space` | Mostrar / ocultar copilot |
| `⌘,` | Ajustes |
| `⌘K` | Paleta de comandos |
| `⌘N` | Nuevo hilo de chat |

## Desarrollo

```bash
git clone https://github.com/kreodevs/ambient-mac-copilot.git
cd ambient-mac-copilot
npm install
npm run dev
```

### Build local (DMG)

```bash
npm run build:mac
```

Los artefactos quedan en `release/`:

- `Ambient-Mac-Copilot-x.y.z-arm64.dmg` — instalación manual (~110 MB, sin ML embebido)
- `Ambient-Mac-Copilot-x.y.z-arm64.zip` — usado por el auto-updater
- `kokoro-mac-arm64.zip` / `picovoice-mac-arm64.zip` — extras opcionales de voz

### Publicar release

```bash
# Sube el tag (dispara GitHub Actions)
git tag v0.1.0
git push origin v0.1.0
```

O manualmente con token de GitHub:

```bash
export GH_TOKEN=ghp_...
npm run release:mac
```

Para notarización en CI, configura estos secrets en el repositorio:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

## Arquitectura

```
src/main/       Electron main — agente, bridge macOS, audio, DB
src/preload/    contextBridge API segura
src/renderer/   React UI (tema liquid glass)
src/shared/     Tipos compartidos
```

Roadmap de herramientas locales: [PLAN_MEJORAS.md](PLAN_MEJORAS.md).

## Licencia

Este proyecto está bajo la licencia [GNU AGPL v3](LICENSE).

Si modificas el software y lo ofreces como servicio en red, debes publicar el código fuente de tus cambios bajo la misma licencia.

## Contribuir

Issues y pull requests son bienvenidos en [github.com/kreodevs/ambient-mac-copilot](https://github.com/kreodevs/ambient-mac-copilot).
