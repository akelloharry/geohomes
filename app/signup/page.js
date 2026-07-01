"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('tenant')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role
        }
      }
    })

    if (signupError) {
      const message = signupError.message?.toLowerCase() || ''
      if (message.includes('already registered') || message.includes('already exists')) {
        setError('Email already registered')
      } else {
        setError(signupError.message)
      }
      setLoading(false)
      return
    }

    console.log('Signup successful for:', email)
    router.push('/login?message=Account created. Please log in.')
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Sign up</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          type="text"
          className="w-full border px-2 py-1"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
        />
        <input
          required
          type="text"
          className="w-full border px-2 py-1"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
        />
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
        <select
          required
          className="w-full border px-2 py-1"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
        >
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        {error && <div className="text-estateRed text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-anchorGray mt-4">
        Already have an account? <a href="/login" className="text-teal">Log in</a>
      </p>
    </div>
  )
}
