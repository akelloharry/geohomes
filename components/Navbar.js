"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const role = profile?.role ?? user?.user_metadata?.role

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-pale-steel/70 bg-cloud-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-start">
          <Link href="/" className="font-heading text-2xl font-black text-deep-maritime">
            Geo<span className="text-official-teal">Home</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-anchor-gray md:flex">
            <a href="#tenants" className="transition hover:text-official-teal">Tenants</a>
            <a href="#landlords" className="transition hover:text-official-teal">Landlords</a>
            <a href="#how-it-works" className="transition hover:text-official-teal">How it works</a>
            {user && <Link href="/chat" className="transition hover:text-official-teal">Messages</Link>}
            {role === 'landlord' && <Link href="/dashboard" className="transition hover:text-official-teal">Dashboard</Link>}
            {role === 'agent' && <Link href="/agent" className="transition hover:text-official-teal">Agent</Link>}
            {role === 'admin' && <Link href="/admin" className="transition hover:text-official-teal">Admin</Link>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-anchor-gray sm:inline">{user.email}</span>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="rounded-full border border-official-teal px-4 py-2 text-sm font-semibold text-official-teal transition hover:bg-official-teal hover:text-white"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-anchor-gray transition hover:text-official-teal">
                Login
              </Link>
              <Link href="/signup" className="rounded-full bg-official-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-deep-maritime">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
