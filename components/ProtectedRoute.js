"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!profile) return

    const role = profile.role ?? user?.user_metadata?.role ?? 'tenant'
    if (allowedRoles && !allowedRoles.includes(role)) {
      if (role === 'landlord') router.replace('/dashboard')
      else if (role === 'agent') router.replace('/agent')
      else if (role === 'admin') router.replace('/admin')
      else router.replace('/')
    }
  }, [user, profile, loading, allowedRoles, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (!profile) return null

  return children
}
