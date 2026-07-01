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

      // Fetch role from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        setError('Could not retrieve user role. Please contact support.')
        setLoading(false)
        return
      }

      // Determine target URL
      let target = '/'
      switch (profile.role) {
        case 'landlord':
          target = '/dashboard'
          break
        case 'agent':
          target = '/agent'
          break
        case 'admin':
          target = '/admin'
          break
        default:
          target = '/'
      }

      // Wait a moment for auth state to update, then navigate
      await new Promise(resolve => setTimeout(resolve, 100))
      setLoading(false)
      router.push(target)
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
        {error && <div className="text-estateRed text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-anchorGray mt-4">
        Don't have an account? <a href="/signup" className="text-teal">Sign up</a>
      </p>
    </div>
  )
}
