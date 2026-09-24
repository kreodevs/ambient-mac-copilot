import { desktopCapturer, screen, systemPreferences } from 'electron'

export async function checkScreenPermission(): Promise<boolean> {
  if (process.platform !== 'darwin') return true
  const status = systemPreferences.getMediaAccessStatus('screen')
  return status === 'granted'
}

async function getPrimaryScreenSource() {
  const primary = screen.getPrimaryDisplay()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: primary.size.width * primary.scaleFactor,
      height: primary.size.height * primary.scaleFactor,
    },
  })

  const match = sources.find(
    (s) => s.display_id === String(primary.id) || s.id.includes(String(primary.id)),
  )
  return match ?? sources[0]
}

export async function captureActiveDisplayBuffer(): Promise<Buffer> {
  const granted = await checkScreenPermission()
  if (!granted) {
    throw new Error(
      'Screen Recording permission denied. Grant access in System Settings → Privacy & Security → Screen Recording.',
    )
  }

  const source = await getPrimaryScreenSource()
  if (!source?.thumbnail) {
    throw new Error('No screen source available for capture')
  }

  return source.thumbnail.toPNG()
}

export async function captureActiveDisplayBase64(): Promise<string> {
  const buffer = await captureActiveDisplayBuffer()
  return buffer.toString('base64')
}
