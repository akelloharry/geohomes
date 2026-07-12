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
  const [showContact, setShowContact] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [submittingContact, setSubmittingContact] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activePhoto, setActivePhoto] = useState('')
  const [expanded, setExpanded] = useState(false)

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
    if (!user) return
    fetchSearchPass()
  }, [user, profile, id])

  useEffect(() => {
    if (!property || !user) return
    supabase.from('property_views').insert({ property_id: property.id, user_id: user.id }).catch(() => null)
  }, [property, user])

  useEffect(() => {
    if (photos.length && !activePhoto) {
      setActivePhoto(photos[0])
    }
  }, [photos, activePhoto])

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
      const { data } = await supabase.from('search_passes').select('*').eq('user_id', user.id).order('expires_at', { ascending: false })
      const active = (data || []).some((pass) => new Date(pass.expires_at) > new Date())
      setHasPass(active)
    } catch (err) {
      console.warn(err)
      setHasPass(false)
    }
    setLoadingPass(false)
  }

  const handleBuyPass = async () => {
    if (!user) return alert('Please log in to purchase a search pass.')
    const phoneNumber = user.user_metadata?.phone || ''
    if (!phoneNumber) return alert('Please add your phone number to your account settings.')

    const res = await fetch('/api/daraja/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, amount: 200, userId: user.id })
    })

    const json = await res.json()
    if (json?.success) {
      setHasPass(true)
      alert(json.bypass ? 'Pass activated instantly.' : 'Payment requested. Your pass will activate after payment is confirmed.')
      return
    }
    alert(json?.error || 'Unable to purchase search pass.')
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
    if (!contactMessage.trim()) return alert('Please enter a message.')
    setSubmittingContact(true)
    try {
      const { error } = await supabase.from('inquiries').insert({
        property_id: property.id,
        landlord_id: property.landlord_id,
        tenant_id: user.id,
        message: contactMessage.trim(),
        status: 'pending'
      })
      if (error) throw error
      setShowContact(false)
      setContactMessage('')
      alert('Your message has been sent.')
    } catch (err) {
      console.error(err)
      alert('Unable to send your message.')
    } finally {
      setSubmittingContact(false)
    }
  }

  const handleSaveProperty = async () => {
    if (!user) return alert('Please log in to save this property.')
    setSaved(true)
    try {
      await supabase.from('saved_properties').insert({ property_id: property.id, user_id: user.id })
    } catch {
      // ignore local save fallback
    }
    alert('Property saved to your favorites.')
  }

  const openDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`, '_blank')
  }

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

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Landlord details</h2>
            <LandlordCard landlord={landlord} hasPass={hasPass} />
          </div>
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
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Bedrooms: {property.bedrooms ?? '—'}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Bathrooms: {property.bathrooms ?? '—'}</div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">Furnished: {property.furnished ? 'Yes' : 'No'}</div>
            </div>

            <ActionButtons
              hasPass={hasPass}
              onContact={() => setShowContact(true)}
              onRequestViewing={handleRequestViewing}
              onSave={handleSaveProperty}
              onBuyPass={handleBuyPass}
              requesting={requesting}
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <MiniMap property={property} hasPass={hasPass} />
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
