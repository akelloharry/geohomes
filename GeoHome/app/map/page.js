'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Map from '../../components/Map'
import { SearchBar } from '../../components/Search/SearchBar'
import { Filters } from '../../components/Search/Filters'
import { ResultsList } from '../../components/Results/ResultsList'
import { BuyPassModal } from '../../components/BuyPassModal'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useFilterStore } from '../../store/filterStore'

const kisumuCenter = [34.7617, -0.0917]

export default function FullMapPage() {
  const { user } = useAuth()
  const [map, setMap] = useState(null)
  const [center, setCenter] = useState(kisumuCenter)
  const [zoom, setZoom] = useState(11)
  const [properties, setProperties] = useState([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [propertiesError, setPropertiesError] = useState<string | null>(null)
  const [hasPass, setHasPass] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [checkingPass, setCheckingPass] = useState(true)
  const [showPassModal, setShowPassModal] = useState(false)

  const { priceMin, priceMax, bedrooms, propertyTypes, furnished, boundaryName } = useFilterStore(
    (state) => ({
      priceMin: state.priceMin,
      priceMax: state.priceMax,
      bedrooms: state.bedrooms,
      propertyTypes: state.propertyTypes,
      furnished: state.furnished,
      boundaryName: state.boundaryName,
    })
  )

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

  useEffect(() => {
    let active = true

    const loadProperties = async () => {
      setLoadingProperties(true)
      setPropertiesError(null)

      try {
        if (boundaryName) {
          const { data, error } = await supabase.rpc('properties_in_boundary', {
            boundary_name: boundaryName,
          })

          if (error) {
            throw error
          }

          const loaded = Array.isArray(data) ? data : []
          const filtered = loaded.filter((property) => {
            if (priceMin > 0 && property.price < priceMin) return false
            if (priceMax < 200000 && property.price > priceMax) return false

            if (bedrooms !== 'any') {
              if (bedrooms === 'studio') {
                if (property.property_type !== 'studio') return false
              } else if (bedrooms === '4+') {
                if (Number(property.bedrooms) < 4) return false
              } else {
                if (Number(property.bedrooms) !== Number(bedrooms)) return false
              }
            }

            if (propertyTypes.length > 0 && !propertyTypes.includes(property.property_type)) {
              return false
            }

            if (furnished !== 'any' && property.furnished !== (furnished === 'true')) {
              return false
            }

            return true
          })

          if (active) {
            setProperties(filtered)
          }
        } else {
          let query = supabase
            .from('properties')
            .select(
              `
              id,
              title,
              address,
              price,
              bedrooms,
              bathrooms,
              property_type,
              furnished,
              lng,
              lat,
              verification_status,
              available,
              landlord_id,
              profiles:landlord_id(first_name, last_name)
            `
            )
            .eq('verification_status', 'verified')
            .eq('available', true)
            .not('lat', 'is', null)
            .not('lng', 'is', null)

          if (priceMin > 0) {
            query = query.gte('price', priceMin)
          }
          if (priceMax < 200000) {
            query = query.lte('price', priceMax)
          }

          if (bedrooms !== 'any') {
            if (bedrooms === 'studio') {
              query = query.eq('property_type', 'studio')
            } else if (bedrooms === '4+') {
              query = query.gte('bedrooms', 4)
            } else {
              query = query.eq('bedrooms', parseInt(bedrooms, 10))
            }
          }

          if (propertyTypes.length > 0) {
            query = query.in('property_type', propertyTypes)
          }

          if (furnished !== 'any') {
            query = query.eq('furnished', furnished === 'true')
          }

          const { data, error } = await query.order('price', { ascending: true })

          if (error) {
            throw error
          }

          if (active) {
            setProperties(data || [])
          }
        }
      } catch (err) {
        if (active) {
          console.error('Error fetching properties:', err)
          setPropertiesError('Failed to load properties. Please try again.')
          setProperties([])
        }
      } finally {
        if (active) {
          setLoadingProperties(false)
        }
      }
    }

    loadProperties()
    return () => {
      active = false
    }
  }, [priceMin, priceMax, bedrooms, propertyTypes, furnished, boundaryName])

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
    setCenter([property.lng, property.lat])
    setZoom(14)
  }

  const refreshPassStatus = async () => {
    if (!sessionId) return
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

  useEffect(() => {
    if (!sessionId) return
    refreshPassStatus()
  }, [sessionId])

  return (
    <div className="relative h-screen w-full flex overflow-hidden bg-[#F9FAFB]">
      {/* Map Background */}
      <div className="absolute inset-0 h-full w-full">
        <Map
          center={center}
          zoom={zoom}
          properties={properties}
          className="h-full w-full"
          onMapLoad={setMap}
          onMarkerClick={handlePropertySelect}
        />
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
        {boundaryName ? (
          <div className="mt-3 rounded-2xl bg-white/90 border border-[#BECCD9] px-4 py-3 text-sm text-[#1E3A4D] shadow-sm pointer-events-auto">
            Showing listings inside <span className="font-semibold">{boundaryName}</span>
          </div>
        ) : null}
      </div>

      {/* Results List - Bottom/Right */}
      <div className="absolute bottom-0 left-0 right-0 md:left-auto md:right-4 md:top-24 md:bottom-4 z-10 pointer-events-none">
        <div className="h-[40vh] md:h-auto md:max-h-[calc(100vh-120px)] pointer-events-auto bg-white rounded-t-2xl md:rounded-2xl shadow-lg border border-[#BECCD9] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <ResultsList
              properties={properties}
              loading={loadingProperties}
              error={propertiesError}
              onSelectProperty={handlePropertySelect}
              hasPass={hasPass}
            />
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

      <button
        onClick={() => setShowPassModal(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-[#2C6E5C] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#245b4c]"
      >
        {hasPass ? 'Pass active' : 'Buy Pass'}
      </button>

      <BuyPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        onSuccess={refreshPassStatus}
        userId={user?.id || null}
      />
    </div>
  )
}
