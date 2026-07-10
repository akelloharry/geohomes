'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const role = data?.user?.user_metadata?.role
      if (role && role !== 'tenant') {
        await supabase.auth.signOut()
        setError('Only tenant accounts can sign in here.')
        setLoading(false)
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      setLoading(false)
      router.push('/')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          required
          type="email"
          className="w-full border px-2 py-1"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          required
          type="password"
          className="w-full border px-2 py-1"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && <div className="text-estate-red text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-official-teal text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-anchor-gray mt-4">
        Don't have an account? <a href="/signup" className="text-official-teal">Sign up</a>
      </p>
    </div>
  )
}
