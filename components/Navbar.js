"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const role = profile?.role ?? user?.user_metadata?.role

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-heading text-2xl font-black text-primary">
            Geo<span className="text-teal">Home</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-midnight">
            <a href="#tenants" className="hover:text-teal transition">Tenants</a>
            <a href="#landlords" className="hover:text-teal transition">Landlords</a>
            <a href="#how-it-works" className="hover:text-teal transition">How it works</a>
            {user && <Link href="/chat" className="hover:text-teal transition">Messages</Link>}
            {role === 'landlord' && <Link href="/dashboard" className="hover:text-teal transition">Dashboard</Link>}
            {role === 'agent' && <Link href="/agent" className="hover:text-teal transition">Agent</Link>}
            {role === 'admin' && <Link href="/admin" className="hover:text-teal transition">Admin</Link>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-anchorGray hidden sm:inline">{user.email}</span>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="rounded-full border border-teal px-4 py-2 text-sm text-teal hover:bg-teal hover:text-white transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-midnight hover:text-teal transition">
                Login
              </Link>
              <Link href="/signup" className="text-sm bg-teal text-white rounded-full px-4 py-2 hover:bg-primary transition">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
