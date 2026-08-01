"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AgentLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const userId = data?.user?.id
    if (!userId) {
      setError('Unable to authenticate agent account.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile || profile.role !== 'agent') {
      await supabase.auth.signOut()
      setError('Only agent accounts can sign in here.')
      setLoading(false)
      return
    }

    router.push('/agent/dashboard')
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-pale-steel bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-deep-maritime">Agent Login</h1>
      <p className="mt-2 text-sm text-anchor-gray">Sign in with your agent account to submit rental properties.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none transition focus:border-official-teal"
          disabled={loading}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none transition focus:border-official-teal"
          disabled={loading}
        />

        {error && <div className="text-sm text-estate-red">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-official-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in as agent'}
        </button>
      </form>

      <p className="mt-6 text-sm text-anchor-gray">
        New agent? <Link href="/agent/signup" className="font-semibold text-official-teal hover:underline">Create an agent account</Link>
      </p>
    </div>
  )
}
