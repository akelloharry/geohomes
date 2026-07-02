"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Map from "../../components/Map"
import Modal from "../../components/Modal"
import { useAuth } from "../../context/AuthContext"
import { supabase } from "../../lib/supabaseClient"

const KISUMU_CENTER = [34.7617, -0.12]

export default function MapPage() {
  const { user, loading: authLoading } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasPass, setHasPass] = useState(false)
  const [checkingPass, setCheckingPass] = useState(true)
  const [showPassModal, setShowPassModal] = useState(false)
  const [purchasingPass, setPurchasingPass] = useState(false)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSessionId = window.localStorage.getItem('geohome_session_id')
    const generatedSessionId = storedSessionId || crypto.randomUUID()
    if (!storedSessionId) {
      window.localStorage.setItem('geohome_session_id', generatedSessionId)
    }
    setSessionId(generatedSessionId)
  }, [])

  useEffect(() => {
    let active = true

    const loadProperties = async () => {
      setLoading(true)
      setError("")

      try {
        const { data: properties, error: queryError } = await supabase
          .from("properties")
          .select("*")
          .eq("available", true)
          .eq("is_active", true)
          .not("lat", "is", null)
          .not("lng", "is", null)
          .order("created_at", { ascending: false })

        if (!active) return

        if (queryError) {
          console.error("❌ Database query error:", queryError)
          setError("Failed to load properties. Please try again.")
          return
        }

        if (!properties || properties.length === 0) {
          setProperties([])
          return
        }

        const validProperties = properties.filter((prop) => {
          if (prop.lat == null || prop.lng == null) {
            return false
          }
          return true
        })

        setProperties(validProperties)
      } catch (err) {
        console.error("❌ Map page error:", err)
        if (active) {
          setError("Connection error. Please check your network.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProperties()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!sessionId || authLoading) return
    const checkPass = async () => {
      setCheckingPass(true)
      try {
        const { data, error } = await supabase.rpc('has_active_pass', {
          user_id: user?.id ?? null,
          session_id: sessionId
        })

        if (error) {
          console.warn('Pass check failed, using fallback', error)
          setHasPass(false)
        } else {
          setHasPass(Boolean(data))
        }
      } catch (err) {
        console.warn('Pass check exception', err)
        setHasPass(false)
      } finally {
        setCheckingPass(false)
      }
    }

    checkPass()
  }, [sessionId, user?.id, authLoading])

  const purchasePass = async () => {
    setPurchasingPass(true)
    try {
      const durationDays = user ? 4 : 3
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      const payload = {
        expires_at: expiresAt,
        paid_amount: 200,
        ...(sessionId ? { session_id: sessionId } : {}),
        ...(user?.id ? { user_id: user.id } : {})
      }

      const { error } = await supabase.from('search_passes').insert(payload)
      if (error) {
        if (error.message?.includes('session_id') || error.message?.includes('column')) {
          const fallbackPayload = {
            expires_at: expiresAt,
            paid_amount: 200,
            ...(user?.id ? { user_id: user.id } : {})
          }
          const { error: fallbackError } = await supabase.from('search_passes').insert(fallbackPayload)
          if (fallbackError) throw fallbackError
        } else {
          throw error
        }
      }

      setHasPass(true)
      setShowPassModal(false)
    } catch (err) {
      console.error('Pass purchase error', err)
      setError('Unable to activate your pass right now. Please try again.')
    } finally {
      setPurchasingPass(false)
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-cloud-white">
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-official-teal shadow-lg transition hover:bg-cloud-white hover:shadow-xl"
      >
        ← Back to Home
      </Link>

      {loading ? (
        <div className="flex h-screen items-center justify-center bg-cloud-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-official-teal border-t-transparent"></div>
            <p className="text-sm text-anchor-gray">Loading properties...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-screen items-center justify-center bg-cloud-white">
          <div className="rounded-[24px] border border-pale-steel bg-white p-6 shadow-sm max-w-md">
            <p className="text-sm text-estate-red font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex rounded-full bg-official-teal px-6 py-2 text-sm font-semibold text-white transition hover:bg-deep-maritime"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <Map center={KISUMU_CENTER} properties={properties} zoom={10} className="h-screen w-full" hasPass={hasPass} onRequestPass={() => setShowPassModal(true)} />
      )}

      <div className="fixed bottom-4 left-4 z-40 rounded-[16px] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-deep-maritime">
          {properties.length} properties found
        </p>
        <p className="mt-1 text-xs text-anchor-gray">
          {hasPass ? 'Full map access unlocked' : 'Buy a pass to unlock full details'}
        </p>
      </div>

      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowPassModal(true)}
          className="rounded-full bg-official-teal px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-deep-maritime"
        >
          {hasPass ? 'Pass active' : 'Buy Pass'}
        </button>
      </div>

      <Modal open={showPassModal} onClose={() => setShowPassModal(false)}>
        <div className="rounded-[28px] bg-white p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-slate-900">Unlock full map access</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            For just KES 200, you can unlock full zoom, property names, and property detail links.
          </p>

          <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">What you get</div>
            <ul className="mt-3 space-y-2">
              <li>• Full map zoom up to 18</li>
              <li>• Full property names and location details</li>
              <li>• Property detail links and contact actions</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[20px] border border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-600">Pass duration</span>
            <span className="font-semibold text-slate-900">{user ? '4 days' : '3 days'}</span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowPassModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Close
            </button>
            <button onClick={purchasePass} disabled={purchasingPass || checkingPass} className="rounded-full bg-official-teal px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {purchasingPass ? 'Processing...' : 'Buy Pass – KES 200'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
