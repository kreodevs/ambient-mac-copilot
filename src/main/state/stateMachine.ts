import { EventEmitter } from 'node:events'
import type { CopilotState } from '../../shared/types.js'

export type StateEvent =
  | 'setupComplete'
  | 'wakeWordOrHotkey'
  | 'meetingStarted'
  | 'commandDone'
  | 'meetingEnded'
  | 'notesSaved'

const transitions: Record<CopilotState, Partial<Record<StateEvent, CopilotState>>> = {
  INITIALIZING: { setupComplete: 'FOCUS_IDLE' },
  FOCUS_IDLE: {
    wakeWordOrHotkey: 'COMMAND_ACTIVE',
    meetingStarted: 'MEETING_MODE',
  },
  COMMAND_ACTIVE: { commandDone: 'FOCUS_IDLE' },
  MEETING_MODE: { meetingEnded: 'POST_PROCESSING' },
  POST_PROCESSING: { notesSaved: 'FOCUS_IDLE' },
}

class StateMachine extends EventEmitter {
  private state: CopilotState = 'INITIALIZING'

  getState(): CopilotState {
    return this.state
  }

  transition(event: StateEvent): CopilotState {
    const next = transitions[this.state]?.[event]
    if (!next) {
      console.warn(`[StateMachine] ignored ${event} from ${this.state}`)
      return this.state
    }
    this.state = next
    this.emit('stateChange', this.state)
    return this.state
  }

  onStateChange(cb: (state: CopilotState) => void): () => void {
    this.on('stateChange', cb)
    return () => this.off('stateChange', cb)
  }
}

export const stateMachine = new StateMachine()
