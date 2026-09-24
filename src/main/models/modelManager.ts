import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { getDatabase } from '../db/database.js'
import { getSettings } from '../config/settingsStore.js'

export interface ModelWarmupResult {
  ok: boolean
  kokoro?: boolean
  error?: string
}

interface ModelsStatus {
  kokoro: boolean
  lastWarmupAt?: number
}

const STATUS_KEY = 'models_status'

function readStatus(): ModelsStatus {
  const row = getDatabase()
    .prepare('SELECT value FROM app_preferences WHERE key = ?')
    .get(STATUS_KEY) as { value: string } | undefined
  if (!row) {
    return { kokoro: false }
  }

  const parsed = JSON.parse(row.value) as Partial<ModelsStatus>
  return { kokoro: parsed.kokoro ?? false, lastWarmupAt: parsed.lastWarmupAt }
}

function writeStatus(status: ModelsStatus): void {
  getDatabase()
    .prepare(
      `INSERT INTO app_preferences (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(STATUS_KEY, JSON.stringify(status))
}

async function warmupKokoro(onProgress: (p: number) => void): Promise<boolean> {
  try {
    const { KokoroTTS } = await import('kokoro-js')
    const settings = getSettings()
    const cacheDir = path.join(app.getPath('userData'), 'kokoro')
    await mkdir(cacheDir, { recursive: true })

    onProgress(0.1)
    await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: settings.tts.dtype,
      device: 'cpu',
      cache_dir: cacheDir,
    })
    onProgress(1)
    return true
  } catch (err) {
    console.warn('[modelManager] Kokoro warmup failed:', err)
    return false
  }
}

export function getModelsStatus(): ModelsStatus & { allReady: boolean } {
  const status = readStatus()
  const kokoroDir = path.join(app.getPath('userData'), 'kokoro')
  const kokoroOnDisk =
    status.kokoro ||
    (fs.existsSync(kokoroDir) && fs.readdirSync(kokoroDir).some((f) => f.endsWith('.onnx')))

  return {
    ...status,
    kokoro: kokoroOnDisk,
    allReady: kokoroOnDisk,
  }
}

export async function warmupAllModels(
  emit?: (model: string, progress: number) => void,
): Promise<ModelWarmupResult> {
  const status = readStatus()

  try {
    emit?.('kokoro', 0)
    status.kokoro = await warmupKokoro((p) => emit?.('kokoro', p))
    status.lastWarmupAt = Date.now()
    writeStatus(status)

    return {
      ok: status.kokoro,
      kokoro: status.kokoro,
      error: status.kokoro ? undefined : 'Kokoro no pudo descargarse; se usará macOS say como fallback',
    }
  } catch (err) {
    writeStatus(status)
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      kokoro: status.kokoro,
    }
  }
}
