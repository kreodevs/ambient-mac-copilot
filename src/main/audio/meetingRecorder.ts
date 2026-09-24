import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { getSettings } from '../config/settingsStore.js'

const emitter = new EventEmitter()
let ffmpegProcess: ReturnType<typeof spawn> | null = null
let outputPath: string | null = null
let startTime = 0

export function onMeetingStatus(cb: (data: { status: string; duration?: number }) => void): () => void {
  emitter.on('status', cb)
  return () => emitter.off('status', cb)
}

export function getRecordingPath(): string | null {
  return outputPath
}

export function startRecording(): void {
  const settings = getSettings()
  const ts = Date.now()
  outputPath = path.join(os.tmpdir(), `meeting_${ts}.wav`)
  startTime = Date.now()

  const ffmpeg = settings.audio.ffmpegPath
  const blackholeIndex = settings.audio.blackholeDeviceIndex

  ffmpegProcess = spawn(ffmpeg, [
    '-f', 'avfoundation',
    '-i', ':0',
    '-f', 'avfoundation',
    '-i', `:${blackholeIndex}`,
    '-filter_complex', '[0:a][1:a]amerge=inputs=2[aout]',
    '-map', '[aout]',
    '-ac', '2',
    '-ar', '16000',
    '-y',
    outputPath,
  ])

  ffmpegProcess.on('error', (err) => {
    console.error('[meetingRecorder] ffmpeg error:', err)
    emitter.emit('status', { status: 'error' })
  })

  emitter.emit('status', { status: 'recording', duration: 0 })
}

export function stopRecording(): string | null {
  if (ffmpegProcess) {
    ffmpegProcess.stdin?.write('q')
    ffmpegProcess.kill('SIGTERM')
    ffmpegProcess = null
  }

  const duration = Math.floor((Date.now() - startTime) / 1000)
  emitter.emit('status', { status: 'stopped', duration })
  return outputPath
}
