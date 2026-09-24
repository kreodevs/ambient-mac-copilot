import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

const nativeExternals = [
  'better-sqlite3',
  '@picovoice/porcupine-node',
  '@picovoice/pvrecorder-node',
  'kokoro-js',
  'openai',
  'electron-native-speech',
  'electron-native-speech-backend-macos',
  'electron-updater',
]

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer/src'),
      '@shared': path.join(__dirname, 'src/shared'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: path.join(__dirname, 'src/main/index.ts'),
        vite: {
          plugins: [
            {
              name: 'copy-db-migrations',
              closeBundle() {
                const src = path.join(__dirname, 'src/main/db/migrations')
                const dest = path.join(__dirname, 'dist-electron/main/migrations')
                fs.cpSync(src, dest, { recursive: true })

                const trayIcon = path.join(__dirname, 'build/tray-icon.png')
                if (fs.existsSync(trayIcon)) {
                  fs.cpSync(trayIcon, path.join(__dirname, 'dist-electron/build/tray-icon.png'))
                }
              },
            },
          ],
          build: {
            outDir: path.join(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: nativeExternals,
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'src/preload/index.ts'),
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist-electron/preload'),
          },
        },
      },
      renderer: {},
    }),
  ],
  root: 'src/renderer',
  publicDir: path.join(__dirname, 'public'),
  build: {
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
  clearScreen: false,
})
