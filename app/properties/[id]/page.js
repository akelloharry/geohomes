'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import PropertyHeader from '../../../components/PropertyDetail/PropertyHeader'
import CoverPhoto from '../../../components/PropertyDetail/CoverPhoto'
import Description from '../../../components/PropertyDetail/Description'
import Amenities from '../../../components/PropertyDetail/Amenities'
import UnitsList from '../../../components/PropertyDetail/UnitsList'
import MiniMap from '../../../components/PropertyDetail/MiniMap'
import LandlordCard from '../../../components/PropertyDetail/LandlordCard'
import ContactModal from '../../../components/PropertyDetail/ContactModal'
import ActionButtons from '../../../components/PropertyDetail/ActionButtons'
import BuyPassCTA from '../../../components/PropertyDetail/BuyPassCTA'

function normalizePhotos(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeAmenities(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function formatCurrency(value) {
  return `KES ${Number(value || 0).toLocaleString()}`
}

export default function PropertyDetail({ params }) {
  const { id } = params
  const router = useRouter()
  const { user, profile } = useAuth()
  const [property, setProperty] = useState(null)
  const [units, setUnits] = useState([])
  const [landlord, setLandlord] = useState(null)
  const [locationPath, setLocationPath] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [hasPass, setHasPass] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [buyingPass, setBuyingPass] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sessionId, setSessionId] = useState('')

  const photos = normalizePhotos(property?.photos)
  const amenities = normalizeAmenities(property?.amenities || property?.amenity_tags || property?.features)
  const description = property?.description || property?.details || ''
  const price = property?.price || property?.rent_price || 0
  const deposit = property?.deposit || property?.deposit_amount || 0
  const coordinates = useMemo(() => {
    const lng = property?.lng ?? property?.longitude ?? property?.location?.coordinates?.[0] ?? 34.7617
    const lat = property?.lat ?? property?.latitude ?? property?.location?.coordinates?.[1] ?? -0.0917
    return [lng, lat]
  }, [property])

  useEffect(() => {
    if (!id) return
    fetchProperty()
  }, [id])

  useEffect(() => {
    if (!sessionId || !user) return
    fetchSearchPass()
  }, [user, profile, sessionId, id])

  useEffect(() => {
    if (!property || !user) return
    supabase.from('property_views').insert({ property_id: property.id, user_id: user.id }).catch(() => null)
  }, [property, user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedSessionId = window.localStorage.getItem('geohome_session_id')
    const generatedSessionId = storedSessionId || crypto.randomUUID()
    if (!storedSessionId) {
      window.localStorage.setItem('geohome_session_id', generatedSessionId)
    }
    setSessionId(generatedSessionId)
  }, [])

  async function fetchProperty() {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle()
      if (error || !data) {
        setError('Property not found or unavailable.')
        setProperty(null)
        return
      }

      setProperty(data)
      setLocationPath('')
      setError(data.verification_status === 'verified' ? '' : 'This listing is not verified yet.')

      try {
        const { data: pathData, error: pathError } = await supabase.rpc('get_property_location_path', { property_id: id })
        if (!pathError && typeof pathData === 'string') {
          setLocationPath(pathData)
        }
      } catch {
        // ignore location path errors
      }

      if (data.landlord_id) {
        const { data: owner } = await supabase.from('profiles').select('full_name, phone, role').eq('id', data.landlord_id).maybeSingle()
        setLandlord(owner || null)
      }

      const { data: unitRows } = await supabase.from('units').select('*').eq('property_id', id).order('name', { ascending: true })
      setUnits(unitRows || [])
    } catch (err) {
      console.error(err)
      setError('Unable to load property details.')
    }
  }

  async function fetchSearchPass() {
    setLoadingPass(true)
    try {
      const { data, error } = await supabase.rpc('has_active_pass', {
        user_id: user?.id || null,
        session_id: sessionId
      })
      if (error) {
        console.warn('Pass check failed:', error)
        setHasPass(false)
      } else {
        setHasPass(Boolean(data))
      }
    } catch (err) {
      console.warn(err)
      setHasPass(false)
    }
    setLoadingPass(false)
  }

  const handleBuyPass = async () => {
    if (!user) return alert('Please log in to purchase a search pass.')

    setBuyingPass(true)
    try {
      const phoneNumber = user.user_metadata?.phone || user.user_metadata?.phone_number || ''
      const res = await fetch('/api/daraja/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber || '254700000000', amount: 200, userId: user.id, sessionId })
      })

      const json = await res.json()
      if (json?.success) {
        setHasPass(true)
        alert(json.bypass ? 'Pass activated instantly.' : 'Payment requested. Your pass will activate after payment is confirmed.')
        return
      }
      alert(json?.error || 'Unable to purchase search pass.')
    } catch (err) {
      console.error(err)
      alert('Unable to purchase search pass.')
    } finally {
      setBuyingPass(false)
    }
  }

  const handleRequestViewing = async () => {
    if (!user) return alert('Please log in to request a viewing.')
    if (!hasPass) return alert('You need an active search pass to request a viewing.')
    setRequesting(true)
    try {
      const res = await fetch('/api/viewing-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: property.id, tenant_id: user.id })
      })
      const json = await res.json()
      if (json?.error) throw new Error(json.error)
      alert('Viewing requested successfully.')
    } catch (err) {
      console.error(err)
      alert('Request failed. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  const handleContactSubmit = async () => {
    if (!user) return alert('Please log in to contact the landlord.')
    setShowContact(true)
  }

  const handleSaveProperty = async () => {
    if (!user) return alert('Please log in to save this property.')
    setSavingProperty(true)
    setSaved(true)
    try {
      await supabase.from('saved_properties').insert({ property_id: property.id, user_id: user.id })
      alert('Property saved to your favorites.')
    } catch {
      alert('Property saved locally for now.')
    } finally {
      setSavingProperty(false)
    }
  }

  const priceRange = units.length
    ? (() => {
        const values = units
          .map((unit) => Number(unit.price ?? unit.rent_price ?? 0))
          .filter(Boolean)
        if (!values.length) return formatCurrency(price)
        const min = Math.min(...values)
        const max = Math.max(...values)
        return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`
      })()
    : formatCurrency(price)

  const depositMonths = property?.deposit_months || property?.deposit_month || 3
  const depositLabel = `${formatCurrency(deposit)} (${depositMonths} month${depositMonths === 1 ? '' : 's'} rent)`
  const availabilityLabel = property?.available === false ? 'Booked' : property?.available_from ? new Date(property.available_from).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Now'

  if (!property) {
    return (
      <div className="mx-auto min-h-[60vh] max-w-5xl px-4 py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Property details</h1>
          <p className="mt-3 text-sm text-slate-600">{error || 'Loading property details...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button onClick={() => router.push('/map')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          ← Back to map
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="space-y-6">
          <PropertyHeader property={property} locationPath={locationPath} />
          <CoverPhoto photos={photos} />

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Rent</p>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(price)}</div>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Deposit</p>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(deposit)}</div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
              <div>Bedrooms: {property.bedrooms ?? '—'}</div>
              <div>Bathrooms: {property.bathrooms ?? '—'}</div>
              <div>Furnished: {property.furnished ? 'Yes' : 'No'}</div>
              <div>Type: {property.property_type || '—'}</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <Description description={description} />
            <Amenities amenities={amenities} />
          </div>

          <UnitsList units={units} propertyId={id} hasPass={hasPass} />

        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Listing</p>
                <div className="mt-2 text-lg font-semibold text-slate-900">{property.verification_status === 'verified' ? 'Verified' : 'Standard'}</div>
              </div>
              <div className="rounded-full bg-mintHint px-3 py-1 text-sm font-medium text-[#2C6E5C]">{property.available === false ? 'Booked' : 'Open'}</div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="font-semibold text-[#1E3A4D]">Price</div>
                <div className="mt-1 text-base text-slate-900">{priceRange}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="font-semibold text-[#1E3A4D]">Deposit</div>
                <div className="mt-1 text-base text-slate-900">{depositLabel}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="font-semibold text-[#1E3A4D]">Available</div>
                <div className="mt-1 text-base text-slate-900">{availabilityLabel}</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Bedrooms: {property.bedrooms ?? '—'}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Bathrooms: {property.bathrooms ?? '—'}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Furnished: {property.furnished ? 'Yes' : 'No'}</div>
            </div>

            {hasPass ? (
              <ActionButtons
                hasPass={hasPass}
                onContact={() => setShowContact(true)}
                onRequestViewing={handleRequestViewing}
                onSave={handleSaveProperty}
                onBuyPass={handleBuyPass}
                requesting={requesting}
                buyingPass={buyingPass}
                savingProperty={savingProperty}
              />
            ) : (
              <BuyPassCTA onBuyPass={handleBuyPass} buyingPass={buyingPass} />
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <MiniMap property={property} hasPass={hasPass} />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <LandlordCard landlord={landlord} hasPass={hasPass} />
          </div>
        </aside>
      </div>

      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        property={property}
        landlord={landlord}
        user={user}
      />
    </div>
  )
}
