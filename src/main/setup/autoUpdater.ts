import { app, BrowserWindow, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '../../shared/types.js'

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000
const STARTUP_DELAY_MS = 15_000

let currentStatus: UpdateStatus = { state: 'idle' }
let getWindow: (() => BrowserWindow | null) | null = null
let intervalId: NodeJS.Timeout | null = null
let promptOpen = false

function setStatus(status: UpdateStatus): void {
  currentStatus = status
  const win = getWindow?.()
  if (win && !win.isDestroyed()) {
    win.webContents.send('update:status', status)
  }
}

function notifyAvailable(version: string, releaseNotes?: string): void {
  if (promptOpen) return
  promptOpen = true

  const detail =
    releaseNotes?.trim() ||
    'Hay una nueva versión disponible. ¿Quieres descargarla e instalarla ahora?'

  void dialog
    .showMessageBox({
      type: 'info',
      title: 'Actualización disponible',
      message: `Ambient Mac Copilot ${version}`,
      detail,
      buttons: ['Descargar', 'Más tarde'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
    .then((result) => {
      promptOpen = false
      if (result.response === 0) {
        void downloadUpdate()
      }
    })
}

function notifyDownloaded(version: string): void {
  if (promptOpen) return
  promptOpen = true

  void dialog
    .showMessageBox({
      type: 'info',
      title: 'Actualización lista',
      message: `La versión ${version} se descargó correctamente.`,
      detail: 'Reinicia la aplicación para completar la instalación.',
      buttons: ['Reiniciar e instalar', 'Más tarde'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    })
    .then((result) => {
      promptOpen = false
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
}

export function getUpdateStatus(): UpdateStatus {
  return currentStatus
}

export async function checkForUpdates(manual = false): Promise<UpdateStatus> {
  if (!app.isPackaged) {
    const status: UpdateStatus = {
      state: 'error',
      message: 'Las actualizaciones automáticas solo están disponibles en la app empaquetada.',
    }
    if (manual) setStatus(status)
    return status
  }

  setStatus({ state: 'checking' })
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result?.updateInfo) {
      setStatus({ state: 'not-available' })
      return currentStatus
    }
    return currentStatus
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    setStatus({ state: 'error', message })
    return currentStatus
  }
}

export async function downloadUpdate(): Promise<UpdateStatus> {
  if (!app.isPackaged) {
    return getUpdateStatus()
  }

  if (currentStatus.state !== 'available' && currentStatus.state !== 'downloading') {
    return currentStatus
  }

  setStatus({ state: 'downloading', percent: 0 })
  try {
    await autoUpdater.downloadUpdate()
    return currentStatus
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    setStatus({ state: 'error', message })
    return currentStatus
  }
}

export function installUpdate(): void {
  if (currentStatus.state === 'downloaded') {
    autoUpdater.quitAndInstall()
  }
}

export function initAutoUpdater(windowGetter: () => BrowserWindow | null): void {
  getWindow = windowGetter

  if (!app.isPackaged) {
    console.log('[update] skipped in development')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    setStatus({ state: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    const status: UpdateStatus = {
      state: 'available',
      version: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    }
    setStatus(status)
    notifyAvailable(info.version, status.releaseNotes)
  })

  autoUpdater.on('update-not-available', () => {
    setStatus({ state: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    setStatus({
      state: 'downloading',
      percent: progress.percent,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setStatus({
      state: 'downloaded',
      version: info.version,
    })
    notifyDownloaded(info.version)
  })

  autoUpdater.on('error', (err) => {
    console.error('[update] error:', err)
    setStatus({
      state: 'error',
      message: err.message,
    })
  })

  setTimeout(() => {
    void checkForUpdates()
  }, STARTUP_DELAY_MS)

  intervalId = setInterval(() => {
    void checkForUpdates()
  }, CHECK_INTERVAL_MS)
}

export function stopAutoUpdater(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
