import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { AudioDevice } from '../../shared/types.js'
import { getSettings } from '../config/settingsStore.js'

const execFileAsync = promisify(execFile)

export async function listOutputDevices(): Promise<AudioDevice[]> {
  try {
    const { stdout } = await execFileAsync('system_profiler', ['SPAudioDataType', '-json'])
    const data = JSON.parse(stdout)
    const devices: AudioDevice[] = []

    for (const item of data.SPAudioDataType ?? []) {
      for (const output of item._items ?? []) {
        if (output.coreaudio_device_output) {
          devices.push({
            id: output._name ?? 'unknown',
            name: output._name ?? 'Unknown',
            portType: output.coreaudio_device_manufacturer,
          })
        }
      }
    }

    if (devices.length === 0) {
      devices.push({ id: 'default', name: 'Default Output' })
    }
    return devices
  } catch {
    return [{ id: 'default', name: 'Default Output' }]
  }
}

export async function resolveOutputDevice(
  preference: string | 'default' | 'headphones-preferred',
): Promise<string> {
  if (preference === 'default') return 'default'

  const devices = await listOutputDevices()

  if (preference !== 'headphones-preferred') {
    return preference
  }

  const headset = devices.find(
    (d) =>
      /bluetooth|headphone|airpods|usb/i.test(d.name) &&
      !/built-in/i.test(d.name),
  )
  return headset?.id ?? 'default'
}

export async function playWav(filePath: string, deviceId?: string): Promise<void> {
  const args = deviceId && deviceId !== 'default' ? ['-d', deviceId, filePath] : [filePath]
  await execFileAsync('afplay', args)
}

export async function getResolvedOutputDevice(): Promise<string> {
  const settings = getSettings()
  return resolveOutputDevice(settings.tts.outputDeviceId)
}
