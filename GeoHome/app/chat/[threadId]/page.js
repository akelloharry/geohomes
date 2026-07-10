"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import ProtectedRoute from '../../../components/ProtectedRoute'

export default function ChatThreadPage({ params }) {
  const { threadId } = params
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState([])
  const [thread, setThread] = useState(null)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) return
    fetchThread()
    const channel = supabase.channel(`thread-${threadId}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${threadId}` },
      (payload) => {
        setMessages((current) => [...current, payload.new])
      }
    ).subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loading, user, threadId])

  async function fetchThread() {
    const { data: threadData, error: threadError } = await supabase.from('chat_threads').select('*').eq('id', threadId).single()
    if (threadError) {
      console.error(threadError)
      return
    }
    setThread(threadData)
    const { data: msgData, error: msgError } = await supabase.from('chat_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true })
    if (msgError) {
      console.error(msgError)
      return
    }
    setMessages(msgData || [])
    const unread = msgData?.filter((msg) => msg.sender_id !== user.id && !msg.read_at) || []
    if (unread.length) {
      await supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).in('id', unread.map((msg) => msg.id))
      setMessages((current) => current.map((msg) => ({ ...msg, read_at: msg.read_at || new Date().toISOString() })))
    }
  }

  const handleSend = async () => {
    if (!content.trim() || sending || !user) return
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({ thread_id: threadId, sender_id: user.id, content: content.trim() })
    if (error) {
      console.error(error)
    } else {
      setContent('')
    }
    setSending(false)
  }

  return (
    <ProtectedRoute allowedRoles={['tenant']}>
      <div className="px-4 py-6 lg:px-8">
        <div className="rounded-3xl border bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Conversation</h1>
              <p className="text-sm text-anchorGray">Tenant chat for thread {threadId}</p>
            </div>
            <div className="text-sm text-anchorGray">Unit {thread?.unit_id ?? 'default'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border bg-white p-6">
            <div className="space-y-4">
              {messages.map((message) => {
                const isMine = message.sender_id === user?.id
                return (
                  <div key={message.id} className={`rounded-3xl p-4 ${isMine ? 'bg-official-teal/10 self-end' : 'bg-slate-100'} max-w-3xl`}>
                    <div className="text-sm text-slate-700">{message.content}</div>
                    <div className="mt-2 text-xs text-anchor-gray">{new Date(message.created_at).toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full border rounded-3xl px-4 py-3" placeholder="Write a message..." />
            <div className="flex justify-end mt-3">
              <button onClick={handleSend} disabled={sending || !content.trim()} className="rounded-full bg-official-teal px-5 py-3 text-white disabled:opacity-60">{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
