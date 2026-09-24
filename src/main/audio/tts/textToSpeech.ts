import { stateMachine } from '../../state/stateMachine.js'
import { createTTSProvider } from './createTTSProvider.js'

export async function speak(text: string): Promise<void> {
  if (stateMachine.getState() === 'MEETING_MODE') return
  const provider = createTTSProvider()
  await provider.speak(text)
}
