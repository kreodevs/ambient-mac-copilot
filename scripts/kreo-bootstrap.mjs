#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const RENDERER = path.join(ROOT, 'src/renderer/src')
const KREO_DIR = path.join(RENDERER, 'components/kreo/ui')
const TMP = '/tmp'

function extractCode(text) {
  const fence = text.match(/```(?:tsx?|jsx?|css)?\n([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.startsWith('import ') || l.startsWith(':root'))
  return start >= 0 ? lines.slice(start).join('\n').trim() : text.trim()
}

function extractThemeCss(text) {
  const match = text.match(/```css\n([\s\S]*?)```/)
  if (match) return match[1].trim()
  const idx = text.indexOf(':root {')
  return idx >= 0 ? text.slice(text.lastIndexOf('/*', idx), text.indexOf('```', idx) > idx ? text.indexOf('```', idx) : undefined).replace(/```$/,'').trim() : ''
}

function readKreo(name) {
  const file = path.join(TMP, `kreo-${name}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  return json.result.content[0].text
}

function fixImports(code) {
  return code
    .replace(/from ["']@\/lib\/utils["']/g, 'from "@/lib/utils"')
    .replace(/from ["']\.\.\/\.\.\/lib\/utils["']/g, 'from "@/lib/utils"')
    .replace(/from ["']\.\/lib\/utils["']/g, 'from "@/lib/utils"')
}

const components = [
  'Dialog',
  'Command',
  'InputText',
  'Card',
  'StatusPill',
  'SettingsLayout',
  'Sonner',
  'TabView',
  'Button',
  'Checkbox',
]

fs.mkdirSync(path.join(RENDERER, 'theme'), { recursive: true })
fs.mkdirSync(KREO_DIR, { recursive: true })

const themeText = readKreo('theme')
const varsCss = extractThemeCss(themeText)
fs.writeFileSync(path.join(RENDERER, 'theme/vars.css'), varsCss + '\n')

const utilsText = readKreo('utils')
const utilsCode = extractCode(utilsText) || utilsText
fs.writeFileSync(path.join(RENDERER, 'lib/utils.ts'), utilsCode + '\n')

for (const name of components) {
  const raw = readKreo(name)
  let code = raw.replace(/^\/\/ \[DEV\][^\n]*\n(\/\/[^\n]*\n)?/m, '')
  if (!code.trim().startsWith('import') && !code.includes('export')) {
    code = extractCode(raw)
  }
  code = fixImports(code.trim()) + '\n'
  fs.writeFileSync(path.join(KREO_DIR, `${name}.tsx`), code)
}

// Barrel re-exports for app imports
const barrel = components
  .map((c) => `export * from './ui/${c}'`)
  .join('\n') + '\n'
fs.writeFileSync(path.join(RENDERER, 'components/kreo/index.ts'), barrel)

// index.css — Kreo vars BEFORE tailwind
const indexCss = `@import '../theme/vars.css';
@import 'tailwindcss';

* {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  background: transparent;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
}

body {
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 3px;
}
`
fs.writeFileSync(path.join(RENDERER, 'styles/index.css'), indexCss)

// design-direction from inspo
let inspoRecommend = ''
let inspoLinear = ''
try {
  inspoRecommend = JSON.parse(fs.readFileSync('/tmp/inspo-linear.json', 'utf8')).result?.content?.[0]?.text || ''
} catch {}
try {
  const rec = await fetch('https://inspomcp.dev/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'recommend',
        arguments: {
          brief: 'macOS ambient copilot command palette, dark translucent glass modal, productivity like Raycast or Linear, compact chat + settings',
        },
      },
    }),
  }).then((r) => r.json())
  inspoRecommend = rec.result?.content?.[0]?.text || ''
} catch {}

const designMd = `# Design Direction — Ambient Mac Copilot

> Generado con **Inspo MCP** + **Kreo MCP** (preset glass).

## Inspo recommend

\`\`\`json
${inspoRecommend.slice(0, 8000)}
\`\`\`

## Referencias clave

| Slug | Rol |
| --- | --- |
| \`linear-app\` | Tipografía compacta, pills, dark productivity |
| \`raycast\` | Command palette, glass modal, atajos |
| \`bento-grid\` | Macroestructura sugerida por Inspo |

## Kreo bootstrap

- \`pull_registry_theme_css({ preset: "glass" })\` → \`src/theme/vars.css\`
- \`pull_registry_utils_code\` → \`src/lib/utils.ts\`
- Componentes en \`src/components/kreo/ui/\`

## Token mapping

| Rol | Variable Kreo |
| --- | --- |
| Glass surface | \`--card\`, \`--background\` |
| Text | \`--foreground\`, \`--foreground-muted\` |
| Accent | \`--primary\`, \`--accent\` |
| Border | \`--card-border\` |
`

fs.writeFileSync(path.join(ROOT, 'src/renderer/design-direction.md'), designMd)

console.log('Kreo bootstrap written:', components.length, 'components')
