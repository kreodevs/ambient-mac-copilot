#!/usr/bin/env node
/**
 * CLI warmup for Kokoro TTS (same logic as models:warmup IPC).
 * Usage: node scripts/warmup-models.mjs
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const USER_DATA = path.join(os.homedir(), 'Library/Application Support/ambient-mac-copilot')
const DB_PATH = path.join(USER_DATA, 'copilot.db')
const STATUS_KEY = 'models_status'

const DEFAULT_TTS = { dtype: 'q8' }

function sqliteJson(query) {
  const out = execFileSync('sqlite3', [DB_PATH, query], { encoding: 'utf-8' }).trim()
  return out || null
}

function readSettings() {
  const raw = sqliteJson("SELECT value FROM app_preferences WHERE key = 'settings';")
  if (!raw) return { tts: DEFAULT_TTS }
  const parsed = JSON.parse(raw)
  return { tts: { ...DEFAULT_TTS, ...parsed.tts } }
}

function readStatus() {
  const raw = sqliteJson(`SELECT value FROM app_preferences WHERE key = '${STATUS_KEY}';`)
  if (!raw) return { kokoro: false }
  const parsed = JSON.parse(raw)
  return { kokoro: parsed.kokoro ?? false, lastWarmupAt: parsed.lastWarmupAt }
}

function writeStatus(status) {
  const json = JSON.stringify(status).replace(/'/g, "''")
  execFileSync('sqlite3', [
    DB_PATH,
    `INSERT INTO app_preferences (key, value) VALUES ('${STATUS_KEY}', '${json}')
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
  ])
}

async function warmupKokoro(dtype, onProgress) {
  const cacheDir = path.join(USER_DATA, 'kokoro')
  await mkdir(cacheDir, { recursive: true })
  onProgress(0.1)
  console.log('[kokoro] Downloading Kokoro-82M ONNX…')
  const { KokoroTTS } = await import('kokoro-js')
  await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype,
    device: 'cpu',
    cache_dir: cacheDir,
  })
  onProgress(1)
  console.log('[kokoro] ready')
}

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found: ${DB_PATH}`)
    console.error('Run the app once (npm run dev) before warming up models.')
    process.exit(1)
  }

  const settings = readSettings()
  const status = readStatus()

  console.log('Ambient Mac Copilot — Kokoro warmup')
  console.log(`  userData: ${USER_DATA}`)
  console.log('')

  try {
    await warmupKokoro(settings.tts.dtype, (p) => {
      if (p === 1 || p === 0.1) console.log(`  kokoro: ${Math.round(p * 100)}%`)
    })
    status.kokoro = true
    status.lastWarmupAt = Date.now()
    writeStatus(status)

    console.log('')
    console.log('Result: OK')
    console.log(JSON.stringify(status, null, 2))
    process.exit(0)
  } catch (err) {
    writeStatus(status)
    console.error('Warmup failed:', err?.message ?? err)
    process.exit(1)
  }
}

main()
