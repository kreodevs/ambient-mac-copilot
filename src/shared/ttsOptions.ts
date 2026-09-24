/** Voces `say` en español (nombres aceptados por `say -v`). */
export const MACOS_TTS_VOICES = [
  { id: 'Monica', label: 'Mónica (España, mujer)' },
  { id: 'Paulina', label: 'Paulina (México, mujer)' },
  { id: 'Jorge', label: 'Jorge (México, hombre)' },
] as const

/** Voces Kokoro en español (disponibles cuando kokoro-js publique el pack multilingüe). */
export const KOKORO_TTS_VOICES_ES = [
  { id: 'ef_dora', label: 'Dora (español, mujer)' },
  { id: 'em_alex', label: 'Alex (español, hombre)' },
  { id: 'em_santa', label: 'Santa (español, hombre)' },
] as const

/** Fallback en inglés en la versión actual de kokoro-js en npm. */
export const KOKORO_TTS_VOICES_EN_FALLBACK = [
  { id: 'af_bella', label: 'Bella (inglés US, mujer)' },
  { id: 'af_nicole', label: 'Nicole (inglés US, mujer)' },
  { id: 'am_michael', label: 'Michael (inglés US, hombre)' },
] as const

export function resolveKokoroVoice(
  preferred: string,
  available: readonly string[],
): string {
  if (available.includes(preferred)) return preferred

  for (const voice of KOKORO_TTS_VOICES_ES) {
    if (available.includes(voice.id)) return voice.id
  }

  for (const voice of KOKORO_TTS_VOICES_EN_FALLBACK) {
    if (available.includes(voice.id)) return voice.id
  }

  return available[0] ?? 'af_bella'
}
