import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage, ChatThread, CopilotState } from '@shared/types'

export function useAgentIPC() {
  const [state, setState] = useState<CopilotState>('INITIALIZING')
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThreadId, setActiveThreadId] = useState('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return window.electronAPI.onStateChange(setState)
  }, [])

  const refreshThreads = useCallback(async () => {
    const list = await window.electronAPI.listThreads()
    setThreads(list)
  }, [])

  const refreshMessages = useCallback(async (threadId: string) => {
    const msgs = await window.electronAPI.getMessages(threadId)
    setMessages(msgs)
  }, [])

  useEffect(() => {
    refreshThreads()
    refreshMessages(activeThreadId)
  }, [activeThreadId, refreshThreads, refreshMessages])

  const sendMessage = useCallback(
    async (text: string) => {
      setLoading(true)
      try {
        await window.electronAPI.sendUserMessage(text)
        await refreshMessages(activeThreadId)
        await refreshThreads()
      } finally {
        setLoading(false)
      }
    },
    [activeThreadId, refreshMessages, refreshThreads],
  )

  const createThread = useCallback(async () => {
    const thread = await window.electronAPI.createThread()
    setActiveThreadId(thread.id)
    await refreshThreads()
  }, [refreshThreads])

  const switchThread = useCallback(
    async (threadId: string) => {
      await window.electronAPI.switchThread(threadId)
      setActiveThreadId(threadId)
    },
    [],
  )

  return {
    state,
    threads,
    activeThreadId,
    messages,
    loading,
    sendMessage,
    createThread,
    switchThread,
    refreshMessages,
  }
}
