import { createRequire } from 'node:module'
import { execFile } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { app } from 'electron'
import type { VoiceExtraId, VoiceExtrasStatus } from '../../shared/types.js'

const execFileAsync = promisify(execFile)
const GITHUB_REPO = 'kreodevs/ambient-mac-copilot'

const EXTRA_META: Record<VoiceExtraId, { label: string; sizeHintMb: number; assetPrefix: string }> = {
  kokoro: { label: 'Kokoro TTS', sizeHintMb: 160, assetPrefix: 'kokoro-mac' },
  picovoice: { label: 'Picovoice wake word', sizeHintMb: 15, assetPrefix: 'picovoice-mac' },
}

const installing = new Set<VoiceExtraId>()

function extrasRoot(id: VoiceExtraId): string {
  return path.join(app.getPath('userData'), 'voice-extras', id)
}

function extrasNodeModules(id: VoiceExtraId): string {
  return path.join(extrasRoot(id), 'node_modules')
}

function installedMarker(id: VoiceExtraId): string {
  return path.join(extrasRoot(id), '.installed')
}

export function isVoiceExtraInstalled(id: VoiceExtraId): boolean {
  if (!app.isPackaged) {
    try {
      if (id === 'kokoro') {
        createRequire(import.meta.url).resolve('kokoro-js')
        return true
      }
      createRequire(import.meta.url).resolve('@picovoice/porcupine-node')
      createRequire(import.meta.url).resolve('@picovoice/pvrecorder-node')
      return true
    } catch {
      return fs.existsSync(installedMarker(id))
    }
  }
  return fs.existsSync(installedMarker(id))
}

export function getVoiceExtrasStatus(): VoiceExtrasStatus {
  return {
    kokoro: {
      installed: isVoiceExtraInstalled('kokoro'),
      installing: installing.has('kokoro'),
      sizeHintMb: EXTRA_META.kokoro.sizeHintMb,
    },
    picovoice: {
      installed: isVoiceExtraInstalled('picovoice'),
      installing: installing.has('picovoice'),
      sizeHintMb: EXTRA_META.picovoice.sizeHintMb,
    },
  }
}

function createExtrasRequire(id: VoiceExtraId): NodeRequire {
  const nm = extrasNodeModules(id)
  const registry = path.join(nm, '.pack.cjs')
  if (!fs.existsSync(nm)) {
    throw new Error(`${EXTRA_META[id].label} no está instalado`)
  }
  if (!fs.existsSync(registry)) {
    fs.writeFileSync(registry, 'module.exports = {};\n')
  }
  return createRequire(registry)
}

export async function importExtraPackage<T>(id: VoiceExtraId, packageName: string): Promise<T> {
  if (!app.isPackaged || isVoiceExtraInstalled(id)) {
    try {
      if (!app.isPackaged) {
        return (await import(packageName)) as T
      }
      if (isVoiceExtraInstalled(id)) {
        return createExtrasRequire(id)(packageName) as T
      }
    } catch (err) {
      if (!app.isPackaged) throw err
    }
  }

  if (!isVoiceExtraInstalled(id)) {
    throw new Error(
      `${EXTRA_META[id].label} no está instalado. Descárgalo en Ajustes → Voz o Audio.`,
    )
  }

  return createExtrasRequire(id)(packageName) as T
}

async function resolveLatestAssetUrl(assetName: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ambient-mac-copilot' },
  })
  if (!res.ok) {
    throw new Error(`No se pudo consultar releases de GitHub (${res.status})`)
  }
  const release = (await res.json()) as { assets?: Array<{ name: string; browser_download_url: string }> }
  const asset = release.assets?.find((item) => item.name === assetName)
  if (!asset) {
    throw new Error(`No se encontró ${assetName} en la última release`)
  }
  return asset.browser_download_url
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Error al descargar (${res.status})`)
  }

  const total = Number(res.headers.get('content-length') ?? 0)
  let received = 0
  const file = createWriteStream(dest)

  await new Promise<void>((resolve, reject) => {
    const reader = res.body!.getReader()

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          received += value.byteLength
          file.write(Buffer.from(value))
          if (total > 0) onProgress?.(received / total)
        }
        file.end()
        resolve()
      } catch (err) {
        file.destroy()
        reject(err)
      }
    }

    file.on('error', reject)
    void pump()
  })
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  await mkdir(destDir, { recursive: true })
  await execFileAsync('unzip', ['-oq', zipPath, '-d', destDir])
}

function platformArchToken(): string {
  return process.arch === 'arm64' ? 'arm64' : 'x64'
}

export async function installVoiceExtra(
  id: VoiceExtraId,
  onProgress?: (progress: number) => void,
): Promise<{ ok: boolean; error?: string }> {
  if (installing.has(id)) {
    return { ok: false, error: 'Ya hay una instalación en curso' }
  }
  if (isVoiceExtraInstalled(id)) {
    return { ok: true }
  }

  installing.add(id)
  const tmpDir = path.join(app.getPath('temp'), `voice-extra-${id}-${Date.now()}`)
  const zipPath = path.join(tmpDir, `${id}.zip`)
  const assetName = `${EXTRA_META[id].assetPrefix}-${platformArchToken()}.zip`

  try {
    await mkdir(tmpDir, { recursive: true })
    onProgress?.(0.02)
    const url = await resolveLatestAssetUrl(assetName)
    onProgress?.(0.05)
    await downloadFile(url, zipPath, (p) => onProgress?.(0.05 + p * 0.8))
    await rm(extrasRoot(id), { recursive: true, force: true })
    await extractZip(zipPath, extrasRoot(id))
    fs.writeFileSync(installedMarker(id), `${new Date().toISOString()}\n`)
    onProgress?.(1)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    installing.delete(id)
    await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

export function getKokoroCacheDir(): string {
  return path.join(app.getPath('userData'), 'kokoro')
}

export async function importKokoroJs(): Promise<{ KokoroTTS: unknown }> {
  return importExtraPackage('kokoro', 'kokoro-js')
}

export async function importPorcupine(): Promise<{ Porcupine: new (...args: unknown[]) => unknown }> {
  return importExtraPackage('picovoice', '@picovoice/porcupine-node')
}

export async function importPvRecorder(): Promise<{ PvRecorder: new (...args: unknown[]) => unknown }> {
  return importExtraPackage('picovoice', '@picovoice/pvrecorder-node')
}
