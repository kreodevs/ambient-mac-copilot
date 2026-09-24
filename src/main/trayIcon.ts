import fs from 'node:fs'
import path from 'node:path'
import { app, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function loadTrayIcon(): Electron.NativeImage {
  const candidates = [
    path.join(__dirname, '../../build/tray-icon.png'),
    path.join(__dirname, '../build/tray-icon.png'),
    path.join(process.cwd(), 'build/tray-icon.png'),
    path.join(app.getAppPath(), 'build/tray-icon.png'),
  ]

  for (const iconPath of candidates) {
    if (!fs.existsSync(iconPath)) continue
    const image = nativeImage.createFromPath(iconPath)
    if (image.isEmpty()) continue

    if (process.platform === 'darwin') {
      image.setTemplateImage(true)
      return image.resize({ width: 18, height: 18 })
    }
    return image.resize({ width: 22, height: 22 })
  }

  console.warn('[tray] tray-icon.png not found; using fallback glyph')
  const fallback = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAI0lEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwAGBgYGBgAAEgYB8R8H7QAAAABJRU5ErkJggg==',
  )
  if (process.platform === 'darwin') fallback.setTemplateImage(true)
  return fallback
}
