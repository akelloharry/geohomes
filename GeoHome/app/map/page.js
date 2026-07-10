'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Map from '../../components/Map'
import { SearchBar } from '../../components/Search/SearchBar'
import { Filters } from '../../components/Search/Filters'
import { ResultsList } from '../../components/Results/ResultsList'
import { supabase } from '../../lib/supabaseClient'

const kisumuCenter = [34.7617, -0.0917]

export default function FullMapPage() {
  const [map, setMap] = useState(null)
  const [hasPass, setHasPass] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [checkingPass, setCheckingPass] = useState(true)

  // Initialize session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSessionId = window.localStorage.getItem('geohome_session_id')
    const generatedSessionId = storedSessionId || crypto.randomUUID()
    if (!storedSessionId) {
      window.localStorage.setItem('geohome_session_id', generatedSessionId)
    }
    setSessionId(generatedSessionId)
  }, [])

  // Check pass status
  useEffect(() => {
    if (!sessionId) return

    const checkPass = async () => {
      setCheckingPass(true)
      try {
        const { data, error } = await supabase.rpc('has_active_pass', {
          user_id: null,
          session_id: sessionId,
        })

        if (error) {
          console.warn('Pass check failed:', error)
          setHasPass(false)
        } else {
          setHasPass(Boolean(data))
        }
      } catch (err) {
        console.warn('Pass check exception:', err)
        setHasPass(false)
      } finally {
        setCheckingPass(false)
      }
    }

    checkPass()
  }, [sessionId])

  const handlePropertySelect = (property) => {
    // Fly to property on map
    if (map) {
      map.flyTo({
        center: [property.lng, property.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }

  return (
    <div className="relative h-screen w-full flex overflow-hidden bg-[#F9FAFB]">
      {/* Map Background */}
      <div className="absolute inset-0 h-full w-full">
        <Map center={kisumuCenter} zoom={11} className="h-full w-full" />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2C6E5C] shadow-lg transition hover:shadow-xl"
      >
        ← Back
      </Link>

      {/* Overlay Content - Top Controls */}
      <div className="absolute top-4 left-20 right-4 md:left-24 md:right-8 z-10 pointer-events-none">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 pointer-events-auto">
            <SearchBar map={map} />
          </div>
          
          {/* Filters */}
          <div className="pointer-events-auto md:w-80">
            <Filters />
          </div>
        </div>
      </div>

      {/* Results List - Bottom/Right */}
      <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:top-24 md:bottom-4 z-10 pointer-events-none">
        <div className="h-[40vh] md:h-auto md:max-h-[calc(100vh-120px)] pointer-events-auto bg-white rounded-t-2xl md:rounded-2xl shadow-lg border border-[#BECCD9] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ResultsList onSelectProperty={handlePropertySelect} hasPass={hasPass} />
          </div>
        </div>
      </div>

      {/* Pass Status Badge */}
      <div className="fixed bottom-4 left-4 z-40 md:hidden">
        <div className="rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur border border-[#BECCD9]">
          <p className="text-xs font-semibold text-[#1E3A4D]">
            {hasPass ? '✓ Pass active' : 'Buy a pass to view details'}
          </p>
        </div>
      </div>
    </div>
  )
}
