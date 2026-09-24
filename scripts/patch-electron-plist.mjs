#!/usr/bin/env node
/**
 * Adds privacy usage descriptions required by Apple Speech to the dev Electron binary.
 * Packaged builds get these from electron-builder.yml extendInfo.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const plist = path.join(root, 'node_modules/electron/dist/Electron.app/Contents/Info.plist')

if (!fs.existsSync(plist)) {
  console.warn('[patch-electron-plist] Electron Info.plist not found — skip')
  process.exit(0)
}

const entries = {
  NSSpeechRecognitionUsageDescription:
    'Ambient Mac Copilot transcribe tu voz localmente con Apple Speech.',
}

function hasKey(key) {
  try {
    execFileSync('/usr/bin/plutil', ['-extract', key, 'raw', '-o', '-', plist], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

for (const [key, value] of Object.entries(entries)) {
  if (hasKey(key)) continue
  execFileSync('/usr/bin/plutil', ['-insert', key, '-string', value, plist])
  console.log(`[patch-electron-plist] added ${key}`)
}
