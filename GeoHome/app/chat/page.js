"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function ChatPage() {
  const { user, profile, loading } = useAuth()
  const [threads, setThreads] = useState([])
  const [loadingThreads, setLoadingThreads] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) return
    fetchThreads()
  }, [user, loading])

  async function fetchThreads() {
    setLoadingThreads(true)
    const filter = { tenant_id: user.id }
    const { data, error } = await supabase.from('chat_threads').select('*, chat_messages(id, read_at)').match(filter).order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      setThreads([])
      setLoadingThreads(false)
      return
    }
    setThreads(data || [])
    setLoadingThreads(false)
  }

  return (
    <ProtectedRoute allowedRoles={['tenant']}>
      <div className="space-y-6 px-4 py-6 lg:px-8">
        <div className="rounded-3xl border bg-white p-6">
          <h1 className="text-3xl font-semibold">Messages</h1>
          <p className="text-sm text-anchorGray mt-2">Your active conversations.</p>
        </div>

        <div className="grid gap-4">
          {loadingThreads ? (
            <div className="rounded-3xl border bg-white p-6 text-center text-anchorGray">Loading threads…</div>
          ) : threads.length === 0 ? (
            <div className="rounded-3xl border bg-white p-6 text-center text-anchorGray">No conversations yet.</div>
          ) : (
            threads.map((thread) => (
              <Link key={thread.id} href={`/chat/${thread.id}`} className="rounded-3xl border bg-white p-5 hover:shadow-sm transition">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold">Property {thread.property_id}</div>
                    <div className="text-sm text-anchorGray">Unit {thread.unit_id || 'Default'} · Started {new Date(thread.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.16em] text-official-teal">Open thread</span>
              {thread.chat_messages?.some((msg) => !msg.read_at && msg.sender_id !== user.id) && (
                <span className="rounded-full bg-estate-red/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-estate-red">New</span>
              )}
            </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
