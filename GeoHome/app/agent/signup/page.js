"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'

export default function AgentSignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          phone,
          role: 'agent'
        }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    router.push('/agent/login')
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-pale-steel bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-deep-maritime">Agent Signup</h1>
      <p className="mt-2 text-sm text-anchor-gray">Create an agent account to submit properties on behalf of landlords.</p>

      <form onSubmit={handleSignup} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none transition focus:border-official-teal"
            disabled={loading}
          />
          <input
            type="text"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Last name"
            className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none transition focus:border-official-teal"
            disabled={loading}
          />
        </div>

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
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone"
          className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-4 py-3 text-sm text-deep-maritime outline-none transition focus:border-official-teal"
          disabled={loading}
        />

        {error && <div className="text-sm text-estate-red">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-official-teal px-4 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create agent account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-anchor-gray">
        Already have an agent account? <Link href="/agent/login" className="font-semibold text-official-teal hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
