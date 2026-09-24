import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatThread } from '@shared/types'
import { ChatHistory } from './ChatHistory'
import { ThreadListPanel } from './ThreadListPanel'
import { InputText } from '@/components/kreo/ui/InputText'
import { Button } from '@/components/kreo/ui/Button'

export interface ChatPanelProps {
  threads: ChatThread[]
  activeThreadId: string
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (text: string) => Promise<void>
  createThread: () => Promise<void>
  switchThread: (threadId: string) => Promise<void>
}

export function ChatPanel({
  threads,
  activeThreadId,
  messages,
  loading,
  sendMessage,
  createThread,
  switchThread,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 96
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        createThread()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [createThread])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-2">
        <ThreadListPanel
          threads={threads}
          activeId={activeThreadId}
          onSelect={switchThread}
          onCreate={createThread}
        />
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <ChatHistory messages={messages} loading={loading} />
          <div ref={bottomRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2">
        <InputText
          fullWidth
          className="min-w-0 flex-1"
          placeholder="Pregunta algo…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" className="shrink-0" disabled={loading || !input.trim()} loading={loading}>
          Enviar
        </Button>
      </form>
    </div>
  )
}
