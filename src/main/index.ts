import {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  Tray,
  shell,
} from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initMasterKey } from './db/secretsCrypto.js'
import { getDatabase, closeDatabase } from './db/database.js'
import {
  initSettingsStore,
  getSettings,
  updateSettings,
  onSettingsChanged,
} from './config/settingsStore.js'
import { initProviderRegistry } from './config/providerRegistry.js'
import { registerIpcHandlers } from './ipc/ipcHandlers.js'
import { stateMachine } from './state/stateMachine.js'
import { commandActivation } from './audio/activation/CommandActivationManager.js'
import { transcribeLive } from './audio/stt/speechToText.js'
import { speak } from './audio/tts/textToSpeech.js'
import * as orchestrator from './agent/orchestrator.js'
import { isMeetingActive } from './audio/meetingDetector.js'
import { startRecording, stopRecording, onMeetingStatus } from './audio/meetingRecorder.js'
import { transcribeFile } from './audio/stt/speechToText.js'
import { summarizeMeeting, persistMeetingSummary } from './agent/meetingSummarizer.js'
import { ensureDefaultThread } from './agent/contextStore.js'
import { bootstrapSecretsFromEnv } from './setup/bootstrap.js'
import { loadTrayIcon } from './trayIcon.js'
import { checkForUpdates, initAutoUpdater, stopAutoUpdater } from './setup/autoUpdater.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !!process.env.VITE_DEV_SERVER_URL
const MAIN_SESSION_KEY = Symbol.for('ambient-mac-copilot.mainSession')

type MainSession = {
  mainWindow?: BrowserWindow | null
  tray?: Tray | null
  meetingInterval?: NodeJS.Timeout
}

function getMainSession(): MainSession {
  const root = globalThis as Record<symbol, MainSession>
  if (!root[MAIN_SESSION_KEY]) root[MAIN_SESSION_KEY] = {}
  return root[MAIN_SESSION_KEY]
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let settingsTabRequested = false

function getWindow(): BrowserWindow | null {
  return mainWindow
}

async function handleCommand(): Promise<void> {
  if (stateMachine.getState() !== 'FOCUS_IDLE') return

  stateMachine.transition('wakeWordOrHotkey')
  commandActivation.pause()

  try {
    const text = await transcribeLive()
    if (text) {
      const { reply } = await orchestrator.run(text, 'general')
      await speak(reply)
    }
  } finally {
    stateMachine.transition('commandDone')
    await commandActivation.resume()
  }
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function createWindow(): void {
  const session = getMainSession()
  if (session.mainWindow && !session.mainWindow.isDestroyed()) {
    mainWindow = session.mainWindow
    return
  }

  mainWindow = new BrowserWindow({
    width: 880,
    height: 560,
    minWidth: 720,
    minHeight: 480,
    center: true,
    frame: false,
    transparent: true,
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 16 },
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('blur', () => {
    const settings = getSettings()
    if (!settings.onboardingCompleted) return
    if (settings.windowPinned) return
    if (!settingsTabRequested) mainWindow?.hide()
  })

  mainWindow.on('show', () => {
    if (settingsTabRequested) {
      mainWindow?.webContents.send('ui:open-settings')
      settingsTabRequested = false
    }
  })

  session.mainWindow = mainWindow
}

function buildTrayMenu(): Menu {
  const pinned = getSettings().windowPinned ?? false

  return Menu.buildFromTemplate([
    {
      label: 'Mostrar / ocultar copilot',
      accelerator: 'Command+Shift+Space',
      click: toggleWindow,
    },
    {
      label: 'Ajustes…',
      accelerator: 'Command+,',
      click: () => {
        settingsTabRequested = true
        mainWindow?.show()
        mainWindow?.focus()
      },
    },
    {
      label: 'Setup Assistant…',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('ui:open-onboarding')
      },
    },
    { type: 'separator' },
    {
      label: 'Mantener visible',
      type: 'checkbox',
      checked: pinned,
      click: (item) => {
        updateSettings({ windowPinned: !!item.checked })
      },
    },
    { type: 'separator' },
    {
      label: 'Buscar actualizaciones…',
      click: () => {
        void checkForUpdates(true)
      },
    },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() },
  ])
}

function refreshTrayMenu(): void {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(buildTrayMenu())
  }
}

function createTray(): void {
  const session = getMainSession()
  if (session.tray && !session.tray.isDestroyed()) {
    tray = session.tray
    refreshTrayMenu()
    return
  }

  const icon = loadTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip('Ambient Mac Copilot — ⌘⇧Space')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', toggleWindow)
  session.tray = tray
}

function registerShortcuts(): void {
  globalShortcut.unregisterAll()
  globalShortcut.register('Command+Shift+Space', () => {
    toggleWindow()
  })

  globalShortcut.register('Command+,', () => {
    settingsTabRequested = true
    mainWindow?.show()
    mainWindow?.focus()
  })
}

function meetingPollLoop(): void {
  const session = getMainSession()
  if (session.meetingInterval) clearInterval(session.meetingInterval)

  session.meetingInterval = setInterval(async () => {
    const state = stateMachine.getState()
    const inMeeting = await isMeetingActive()

    if (state === 'FOCUS_IDLE' && inMeeting) {
      stateMachine.transition('meetingStarted')
      commandActivation.pause()
      startRecording()
      mainWindow?.webContents.send('meeting:status', { status: 'recording' })
    }

    if (state === 'MEETING_MODE' && !inMeeting) {
      stateMachine.transition('meetingEnded')
      const wavPath = stopRecording()
      mainWindow?.webContents.send('meeting:status', { status: 'processing' })

      if (wavPath) {
        try {
          const transcript = await transcribeFile(wavPath)
          const summary = await summarizeMeeting(transcript)
          await persistMeetingSummary(summary)
          mainWindow?.webContents.send('meeting:status', {
            status: 'complete',
            summary,
          })
        } catch (err) {
          console.error('[meeting] post-processing failed:', err)
        }
      }

      stateMachine.transition('notesSaved')
      await commandActivation.resume()
    }
  }, 5000)
}

async function bootstrapMain(): Promise<void> {
  initMasterKey()
  getDatabase()
  initSettingsStore()
  onSettingsChanged((settings) => {
    refreshTrayMenu()
    mainWindow?.webContents.send('settings:sync', settings)
  })
  const boot = bootstrapSecretsFromEnv()
  if (boot.configured.length > 0) {
    console.log(`[bootstrap] configured from env: ${boot.configured.join(', ')}`)
  }
  initProviderRegistry()
  ensureDefaultThread()

  createWindow()
  createTray()
  registerShortcuts()
  registerIpcHandlers(getWindow)
  initAutoUpdater(getWindow)
  commandActivation.init(() => handleCommand())
  onMeetingStatus((data) => {
    mainWindow?.webContents.send('meeting:status', data)
  })

  if (stateMachine.getState() === 'INITIALIZING') {
    stateMachine.transition('setupComplete')
  }
  await commandActivation.start()
  meetingPollLoop()

  const settings = getSettings()
  if (!settings.onboardingCompleted && mainWindow && !mainWindow.isVisible()) {
    mainWindow.show()
    mainWindow.webContents.send('ui:open-onboarding')
  }
}

if (app.isReady()) {
  void bootstrapMain()
} else {
  app.whenReady().then(bootstrapMain)
}

app.on('will-quit', () => {
  stopAutoUpdater()
  commandActivation.stop()
  globalShortcut.unregisterAll()
  closeDatabase()
})

app.on('window-all-closed', () => {
  // Tray app — keep running in background
})

app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
})
