"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <nav className="w-full bg-cloud-white shadow-sm border-b border-pale-steel">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-heading text-2xl font-black text-deep-maritime">
            Geo<span className="text-official-teal">Home</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-anchor-gray">
            <a href="#" className="hover:text-official-teal transition">Map</a>
            <a href="#" className="hover:text-official-teal transition">Search</a>
            {user && <Link href="/chat" className="hover:text-official-teal transition">Messages</Link>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-anchor-gray hidden sm:inline">{user.email}</span>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/')
                }}
                className="rounded-full border border-official-teal px-4 py-2 text-sm text-official-teal hover:bg-official-teal hover:text-white transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-deep-maritime hover:text-official-teal transition">
                Login
              </Link>
              <Link href="/signup" className="text-sm rounded-full bg-official-teal px-4 py-2 font-medium text-white hover:bg-muted-teal transition">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
