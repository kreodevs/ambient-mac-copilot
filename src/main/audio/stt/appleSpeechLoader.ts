import { createRequire } from 'node:module'
import type {
  FileTranscriptionOptions,
  FileTranscriptionResult,
  SpeechAvailability,
  SpeechSession,
} from 'electron-native-speech'

const require = createRequire(import.meta.url)

export interface AppleSpeechModule {
  getSpeechAvailability(): Promise<SpeechAvailability>
  transcribeFile(options: FileTranscriptionOptions): Promise<FileTranscriptionResult>
  createSpeechSession(): Promise<SpeechSession>
}

let cached: AppleSpeechModule | null = null

export function loadAppleSpeech(): AppleSpeechModule {
  if (!cached) {
    cached = require('electron-native-speech') as AppleSpeechModule
  }
  return cached
}
