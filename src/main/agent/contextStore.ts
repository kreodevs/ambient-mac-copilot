import * as repo from '../db/contextRepository.js'
import type { ChatMessage, ChatThread } from '../../shared/types.js'

export function listThreads(): ChatThread[] {
  return repo.listThreads()
}

export function createThread(title?: string): ChatThread {
  return repo.createThread(title)
}

export function getThread(id: string): ChatThread | null {
  return repo.getThread(id)
}

export function deleteThread(id: string): void {
  repo.deleteThread(id)
}

export function getMessages(threadId: string, limit?: number): ChatMessage[] {
  return repo.getMessages(threadId, limit)
}

export function appendMessage(
  threadId: string,
  message: Omit<ChatMessage, 'id' | 'threadId' | 'createdAt'>,
): ChatMessage {
  return repo.appendMessage(threadId, message)
}

export function ensureDefaultThread(): ChatThread {
  return repo.ensureDefaultThread()
}

export function autoTitleFromMessage(threadId: string, content: string): void {
  const thread = repo.getThread(threadId)
  if (!thread || thread.title !== 'Nueva conversación') return
  const title = content.slice(0, 48) + (content.length > 48 ? '…' : '')
  repo.updateThreadTitle(threadId, title)
}
