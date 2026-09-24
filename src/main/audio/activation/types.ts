export type ActivationMode = 'push-to-talk' | 'wake-word' | 'none'

export interface CommandActivationProvider {
  readonly mode: ActivationMode
  start(onActivate: () => void): Promise<void>
  stop(): void
}
