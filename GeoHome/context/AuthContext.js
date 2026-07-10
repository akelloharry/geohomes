"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchProfile = async (id) => {
      if (!id) return null
      const { data: p, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
      return error ? null : p
    }

    const handleSession = async (session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user?.id) {
        const profileData = await fetchProfile(session.user.id)
        if (!mounted) return
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    }

    async function init() {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Auth init getSession error:', error)
          if (error.status === 400 || error.message?.includes('refresh_token')) {
            await supabase.auth.signOut()
          }
        }
        await handleSession(data?.session ?? null)
      } catch (err) {
        console.error('Auth init error:', err)
      }
      if (!mounted) return
      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      setLoading(true)
      await handleSession(session)
      if (!mounted) return
      setLoading(false)
    })

    return () => {
      mounted = false
      if (listener?.subscription) {
        listener.subscription.unsubscribe()
      }
    }
  }, [])

  // signUp supports passing metadata so DB trigger can create profile
  const signUp = (email, password, first_name, last_name, phone, role = 'tenant') => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
          phone,
          role
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
      }
    })
  }

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = async () => await supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
