"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import ProtectedRoute from '../../../components/ProtectedRoute'
import SubmissionList from '../../../components/Agent/SubmissionList'

export default function AgentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['agent']}>
      <AgentDashboardInner />
    </ProtectedRoute>
  )
}

function AgentDashboardInner() {
  const { user, profile } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const counts = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending_review').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length
  }), [submissions])

  useEffect(() => {
    if (!user || !profile) return
    if (profile.role !== 'agent') return

    fetchSubmissions()
  }, [user, profile])

  async function fetchSubmissions() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('agent_submissions')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError('Unable to load submissions.')
      console.error(error)
    } else {
      setSubmissions(data ?? [])
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this pending submission?')) return

    const { error } = await supabase
      .from('agent_submissions')
      .delete()
      .eq('id', id)
      .eq('agent_id', user.id)
      .eq('status', 'pending_review')

    if (error) {
      alert('Unable to delete submission.')
      console.error(error)
      return
    }
    setSubmissions((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="rounded-[28px] border border-pale-steel bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Agent portal</p>
            <h1 className="mt-3 text-3xl font-bold text-deep-maritime">Your submissions</h1>
          </div>
          <button
            onClick={() => router.push('/agent/submit')}
            className="inline-flex items-center justify-center rounded-full bg-official-teal px-5 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal"
          >
            + New submission
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-anchor-gray">Total</p>
            <div className="mt-3 text-3xl font-bold text-deep-maritime">{counts.total}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-anchor-gray">Pending</p>
            <div className="mt-3 text-3xl font-bold text-[#B59F0E]">{counts.pending}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-anchor-gray">Approved</p>
            <div className="mt-3 text-3xl font-bold text-[#047857]">{counts.approved}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-anchor-gray">Rejected</p>
            <div className="mt-3 text-3xl font-bold text-[#B91C1C]">{counts.rejected}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-pale-steel bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-deep-maritime">Submission list</h2>
            <p className="mt-1 text-sm text-anchor-gray">Manage your pending reviews, edits, and history.</p>
          </div>
          <button
            onClick={fetchSubmissions}
            className="rounded-full border border-pale-steel bg-cloud-white px-4 py-2 text-sm font-semibold text-deep-maritime hover:bg-cloud-white/90"
          >
            Refresh
          </button>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-estate-red/10 bg-estate-red/5 p-4 text-sm text-estate-red">{error}</div>}

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-8 text-center text-sm text-anchor-gray">Loading submissions…</div>
          ) : (
            <SubmissionList submissions={submissions} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  )
}
