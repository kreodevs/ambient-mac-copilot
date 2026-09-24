import { randomUUID } from 'node:crypto'
import type { ChatMessage, ChatThread } from '../../shared/types.js'
import { getDatabase } from './database.js'

interface ThreadRow {
  id: string
  title: string
  created_at: number
  updated_at: number
}

interface MessageRow {
  id: string
  thread_id: string
  role: string
  content: string
  action_data: string | null
  created_at: number
}

function mapThread(row: ThreadRow): ChatThread {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    actionData: row.action_data ? JSON.parse(row.action_data) : undefined,
    createdAt: row.created_at,
  }
}

export function listThreads(): ChatThread[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM chat_threads ORDER BY updated_at DESC')
    .all() as ThreadRow[]
  return rows.map(mapThread)
}

export function getThread(id: string): ChatThread | null {
  const row = getDatabase()
    .prepare('SELECT * FROM chat_threads WHERE id = ?')
    .get(id) as ThreadRow | undefined
  return row ? mapThread(row) : null
}

export function createThread(title = 'Nueva conversación'): ChatThread {
  const now = Date.now()
  const thread: ChatThread = {
    id: randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
  }
  getDatabase()
    .prepare(
      'INSERT INTO chat_threads (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    )
    .run(thread.id, thread.title, thread.createdAt, thread.updatedAt)
  return thread
}

export function deleteThread(id: string): void {
  getDatabase().prepare('DELETE FROM chat_threads WHERE id = ?').run(id)
}

export function touchThread(id: string): void {
  getDatabase()
    .prepare('UPDATE chat_threads SET updated_at = ? WHERE id = ?')
    .run(Date.now(), id)
}

export function updateThreadTitle(id: string, title: string): void {
  getDatabase()
    .prepare('UPDATE chat_threads SET title = ?, updated_at = ? WHERE id = ?')
    .run(title, Date.now(), id)
}

export function getMessages(threadId: string, limit = 100): ChatMessage[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM chat_messages WHERE thread_id = ?
       ORDER BY created_at ASC LIMIT ?`,
    )
    .all(threadId, limit) as MessageRow[]
  return rows.map(mapMessage)
}

export function appendMessage(
  threadId: string,
  message: Omit<ChatMessage, 'id' | 'threadId' | 'createdAt'> & { id?: string },
): ChatMessage {
  const full: ChatMessage = {
    id: message.id ?? randomUUID(),
    threadId,
    role: message.role,
    content: message.content,
    actionData: message.actionData,
    createdAt: Date.now(),
  }

  getDatabase()
    .prepare(
      `INSERT INTO chat_messages (id, thread_id, role, content, action_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      full.id,
      full.threadId,
      full.role,
      full.content,
      full.actionData ? JSON.stringify(full.actionData) : null,
      full.createdAt,
    )

  touchThread(threadId)
  return full
}

export function ensureDefaultThread(): ChatThread {
  const existing = getDatabase()
    .prepare('SELECT * FROM chat_threads WHERE id = ?')
    .get('general') as ThreadRow | undefined

  if (existing) return mapThread(existing)

  const now = Date.now()
  getDatabase()
    .prepare(
      'INSERT INTO chat_threads (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
    )
    .run('general', 'General', now, now)

  return { id: 'general', title: 'General', createdAt: now, updatedAt: now }
}
