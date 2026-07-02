"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import { supabase } from '../../../lib/supabaseClient'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../context/AuthContext'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-6.5-4.2-8.2-8.1A4.9 4.9 0 0112 6.2a4.9 4.9 0 018.2 5.7C18.5 15.8 12 20 12 20z" />
    </svg>
  )
}

function BedIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10V7a2 2 0 012-2h4a2 2 0 012 2v3m-8 0h16v6H4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v2m8-2v2" />
    </svg>
  )
}

function BathIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14a2 2 0 012 2v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12V8a3 3 0 016 0" />
    </svg>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-5H9v5H4a1 1 0 01-1-1v-9.5z" />
    </svg>
  )
}

function MapPinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  )
}

function MessageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3V8a2 2 0 012-2z" />
    </svg>
  )
}

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.3-2.6 7.8-7 10-4.4-2.2-7-5.7-7-10V6l7-3z" />
    </svg>
  )
}

function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function MiniMap({ coordinates }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !coordinates) return

    const [lng, lat] = coordinates
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
      dragPan: false,
      scrollZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false,
    })

    new mapboxgl.Marker({ color: '#2C6E5C' }).setLngLat([lng, lat]).addTo(map)

    return () => map.remove()
  }, [coordinates])

  return <div ref={containerRef} className="h-48 w-full overflow-hidden rounded-2xl" />
}

function normalizePhotos(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function normalizeAmenities(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function buildPlaceholder() {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="#E6F4F1" />
      <rect x="80" y="80" width="1040" height="640" rx="36" fill="#F8FCFB" />
      <path d="M220 580c70-120 150-180 240-180 80 0 150 40 240 140l120-100c65-55 150-94 230-110v250H220z" fill="#2C6E5C" fill-opacity="0.16" />
      <circle cx="420" cy="320" r="90" fill="#2C6E5C" fill-opacity="0.18" />
      <text x="600" y="420" text-anchor="middle" font-size="48" fill="#2C6E5C" font-family="Arial, sans-serif">No photo available</text>
    </svg>
  `)
}

export default function PropertyDetail({ params }) {
  const { id } = params
  const router = useRouter()
  const [property, setProperty] = useState(null)
  const [units, setUnits] = useState([])
  const [landlord, setLandlord] = useState(null)
  const [locationPath, setLocationPath] = useState('')
  const [error, setError] = useState(null)
  const { user, profile } = useAuth()
  const [hasPass, setHasPass] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)
  const [thread, setThread] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [activePhoto, setActivePhoto] = useState('')
  const [showGallery, setShowGallery] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProperty()
  }, [id])

  useEffect(() => {
    if (!user) return
    fetchSearchPass()
    fetchThread()
  }, [user, profile, id])

  useEffect(() => {
    if (!property) return
    if (!user) return
    ;(async () => {
      try {
        const { error } = await supabase.from('property_views').insert({ property_id: property.id, user_id: user.id })
        if (error) console.warn('property_views insert error', error)
      } catch (err) {
        console.error('Failed to record property view', err)
      }
    })()
  }, [property, user])

  useEffect(() => {
    if (property?.photos?.length) {
      setActivePhoto(property.photos[0])
    }
  }, [property?.id])

  async function fetchProperty() {
    try {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single()
      if (error) {
        setError('Property not found or is unavailable right now.')
        setProperty(null)
        return
      }

      setProperty(data)
      setError(null)
      setLocationPath('')

      try {
        const { data: pathData, error: pathError } = await supabase.rpc('get_property_location_path', { property_id: id })
        if (!pathError) {
          setLocationPath(pathData || '')
        }
      } catch (e) {
        console.warn('Location path lookup failed', e)
      }

      if (data?.landlord_id) {
        try {
          const { data: owner, error: ownerError } = await supabase
            .from('profiles')
            .select('first_name,last_name,phone,email,full_name')
            .eq('id', data.landlord_id)
            .maybeSingle()

          if (ownerError) {
            console.warn('Failed to load landlord profile', ownerError)
            setLandlord(null)
          } else {
            setLandlord(owner || null)
          }
        } catch (e) {
          console.warn('Exception fetching landlord profile', e)
          setLandlord(null)
        }
      }

      try {
        const { data: unitData, error: unitError } = await supabase.from('units').select('*').eq('property_id', id)
        if (unitError) {
          console.warn('Failed to load units', unitError)
          setUnits([])
        } else {
          const list = (unitData || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          setUnits(list)
        }
      } catch (e) {
        console.warn('Exception fetching units', e)
        setUnits([])
      }
    } catch (err) {
      console.error('fetchProperty error', err)
      setError('Property not found or is unavailable right now.')
    }
  }

  async function fetchThread(unitId = null) {
    if (!user) return
    const role = profile?.role || user?.user_metadata?.role
    const baseQuery = supabase.from('chat_threads').select('*').eq('property_id', id).order('created_at', { ascending: false })
    const filter = role === 'landlord' ? { landlord_id: String(user.id) } : { tenant_id: String(user.id) }
    baseQuery.match(filter)

    if (unitId != null) {
      let unitVal = unitId
      if (typeof unitVal === 'object') unitVal = unitVal.id ?? unitVal.toString()
      unitVal = String(unitVal)
      baseQuery.eq('unit_id', unitVal)
    }

    const { data, error } = await baseQuery.limit(1)
    if (error) {
      console.error(error)
      setThread(null)
      return
    }
    setThread((data || [])[0] || null)
  }

  async function fetchSearchPass() {
    if (!user) return
    setLoadingPass(true)
    try {
      const { data } = await supabase.from('search_passes').select('*').eq('user_id', user.id).order('expires_at', { ascending: false })
      const now = new Date()
      const has = (data || []).some((p) => new Date(p.expires_at) > now)
      setHasPass(has)
    } catch (e) {
      console.warn('fetchSearchPass error', e)
      setHasPass(false)
    }
    setLoadingPass(false)
  }

  const buySearchPass = async () => {
    if (!user) return alert('Please login to buy a search pass')
    const res = await fetch('/api/mpesa/stkpush', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: user.user_metadata?.phone || user.email, amount: 200, account: 'search_pass', description: 'GeoHome search pass' }) })
    const json = await res.json()
    if (json?.status) {
      const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await supabase.from('search_passes').insert({ user_id: user.id, expires_at, paid_amount: 200 })
      alert('Search pass purchased — valid 7 days')
      setHasPass(true)
    } else {
      alert('Payment failed')
    }
  }

  const requestViewing = async () => {
    if (!user) return alert('Please login to request viewing')
    if (!hasPass) return alert('You need an active search pass to request viewing.')
    setRequesting(true)
    const res = await fetch('/api/viewing-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: property.id, tenant_id: user.id })
    })
    const json = await res.json()
    setRequesting(false)
    if (json?.error) {
      alert('Request failed: ' + json.error)
    } else {
      alert('Viewing requested successfully')
    }
  }

  const startChat = async (unitId = null) => {
    if (!user) return alert('Please login to message the landlord')
    let unitVal = null
    if (unitId != null) {
      unitVal = typeof unitId === 'object' ? (unitId.id ?? String(unitId)) : String(unitId)
    }
    await fetchThread(unitVal)
    if (thread && thread.unit_id === unitId) {
      router.push(`/chat/${thread.id}`)
      return
    }
    try {
      const payload = {
        property_id: String(property.id),
        landlord_id: String(property.landlord_id),
        tenant_id: String(user.id),
        unit_id: unitVal,
        status: 'open'
      }
      const { data, error } = await supabase.from('chat_threads').insert(payload).select('id').single()
      if (error || !data) {
        console.error('chat_threads insert error', error)
        return alert('Could not open chat thread. Please try again.')
      }
      router.push(`/chat/${data.id}`)
    } catch (e) {
      console.error('startChat exception', e)
      alert('Could not open chat thread. Please try again.')
    }
  }

  const handleContactSubmit = async () => {
    if (!user) return alert('Please login to contact the landlord')
    if (!contactMessage.trim()) return alert('Please add a short message before sending')
    setSubmitting(true)
    try {
      const { error } = await supabase.from('inquiries').insert({
        property_id: property.id,
        landlord_id: property.landlord_id || property.owner_id || null,
        user_id: user.id,
        message: contactMessage.trim()
      })
      if (error) throw error
      setShowContact(false)
      setContactMessage('')
      alert('Your message was sent successfully')
    } catch (e) {
      console.error('Inquiry submit error', e)
      alert('Unable to send your message right now')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveProperty = async () => {
    if (!user) return alert('Please login to save this property')
    if (typeof window === 'undefined') return

    const key = 'saved_properties'
    const existing = JSON.parse(window.localStorage.getItem(key) || '[]')
    if (existing.includes(property.id)) {
      setSaved(true)
      return alert('This property is already saved')
    }

    existing.push(property.id)
    window.localStorage.setItem(key, JSON.stringify(existing))
    setSaved(true)

    try {
      await supabase.from('saved_properties').insert({ property_id: property.id, user_id: user.id })
    } catch (e) {
      console.warn('Saved properties insert skipped', e)
    }

    alert('Property saved to your favorites')
  }

  if (!property) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-16">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Property details</h1>
          <p className="mt-3 text-sm text-slate-600">{error || 'Loading property...'}</p>
        </div>
      </div>
    )
  }

  const role = profile?.role || user?.user_metadata?.role || 'tenant'
  const photos = normalizePhotos(property.photos)
  const amenities = normalizeAmenities(property.amenities || property.amenity_tags || property.features)
  const description = property.description || property.details || 'This property has a great location, comfortable layout, and all the essentials for a smooth stay.'
  const shortDescription = description.length > 140 ? `${description.slice(0, 140)}...` : description
  const price = property.price || property.rent_price || 0
  const deposit = property.deposit || property.deposit_amount || 0
  const lng = property.lng ?? property.longitude ?? (property.location && property.location.coordinates ? property.location.coordinates[0] : 34.7617)
  const lat = property.lat ?? property.latitude ?? (property.location && property.location.coordinates ? property.location.coordinates[1] : -0.0917)
  const landlordName = landlord?.full_name || [landlord?.first_name, landlord?.last_name].filter(Boolean).join(' ') || 'Landlord'
  const activePass = hasPass && !loadingPass

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <button onClick={() => router.push('/map')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to map
      </button>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="relative">
              <img src={activePhoto || photos[0] || buildPlaceholder()} alt={property.title || 'Property'} className="h-[320px] w-full object-cover sm:h-[420px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-slate-800">
                <ShieldIcon className="h-4 w-4 text-teal" />
                {property.verification_status === 'verified' ? 'Verified listing' : 'Active listing'}
              </div>
              <button onClick={() => setShowGallery(true)} className="absolute bottom-4 right-4 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white shadow-lg">
                View gallery ({photos.length || 1})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {photos.slice(0, 4).map((photo, index) => (
                <button key={`${photo}-${index}`} onClick={() => setActivePhoto(photo)} className={`overflow-hidden rounded-2xl border ${activePhoto === photo ? 'border-teal' : 'border-slate-200'}`}>
                  <img src={photo} alt={`Photo ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
              {!photos.length && (
                <div className="col-span-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No gallery photos available for this listing yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{property.title || 'Property details'}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <MapPinIcon className="h-4 w-4 text-teal" />
                  <span>{locationPath || 'Location path unavailable'}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{property.address || 'No address available'}</div>
              </div>
              <div className="rounded-full bg-mintHint px-3 py-1 text-sm font-medium text-teal">
                {property.available === false ? 'Unavailable' : 'Available now'}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Description</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {expanded ? description : shortDescription}
                </p>
                {description.length > 140 && (
                  <button onClick={() => setExpanded((value) => !value)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal">
                    {expanded ? 'Read less' : 'Read more'}
                    <ChevronDownIcon className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {amenities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Amenities</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {amenities.map((item) => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
              <span className="text-sm text-slate-500">Property map</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200">
              <MiniMap coordinates={[lng, lat]} />
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Monthly rent</p>
                <div className="mt-2 text-3xl font-semibold text-slate-900">KES {Number(price).toLocaleString()}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">{property.property_type || 'Property'}</span>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <BedIcon className="h-5 w-5 text-teal" />
                <span>{property.bedrooms ?? '—'} bedrooms</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <BathIcon className="h-5 w-5 text-teal" />
                <span>{property.bathrooms ?? '—'} bathrooms</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <HomeIcon className="h-5 w-5 text-teal" />
                <span>{property.property_type || 'Property type'} • {property.furnished ? 'Furnished' : 'Unfurnished'}</span>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Deposit</span>
                <span className="font-semibold text-slate-900">KES {Number(deposit).toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Availability</span>
                <span className="font-semibold text-slate-900">{property.available === false ? 'Booked' : 'Ready'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal/10 text-teal">
                <HomeIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">{landlordName}</div>
                <div className="text-sm text-slate-500">Usually responds within a few hours</div>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><MessageIcon className="h-4 w-4 text-teal" /> <span>{landlord?.phone ? landlord.phone : 'Phone shared on request'}</span></div>
              <div className="flex items-center gap-2"><EyeIcon className="h-4 w-4 text-teal" /> <span>{property.views || 0} property views</span></div>
            </div>

            <div className="mt-6 space-y-3">
              <button onClick={() => setShowContact(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-teal px-4 py-3 text-sm font-semibold text-white">
                <MessageIcon className="h-4 w-4" />
                Contact landlord
              </button>
              <button onClick={requestViewing} disabled={!activePass || requesting} className="flex w-full items-center justify-center gap-2 rounded-full border border-teal px-4 py-3 text-sm font-semibold text-teal disabled:cursor-not-allowed disabled:opacity-60">
                <EyeIcon className="h-4 w-4" />
                {requesting ? 'Requesting…' : 'Request viewing'}
              </button>
              <button onClick={handleSaveProperty} className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <HeartIcon className={`h-4 w-4 ${saved ? 'fill-teal text-teal' : ''}`} />
                {saved ? 'Saved property' : 'Save property'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={showContact} onClose={() => setShowContact(false)}>
        <div className="rounded-[28px] bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-900">Contact the landlord</h3>
          <p className="mt-2 text-sm text-slate-600">Send a short note with your preferred move-in date and questions about the listing.</p>
          <textarea value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} rows="5" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-teal" placeholder="Hi, I am interested in this property..." />
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setShowContact(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button onClick={handleContactSubmit} disabled={submitting} className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showGallery} onClose={() => setShowGallery(false)}>
        <div className="rounded-[28px] bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Gallery</h3>
              <p className="text-sm text-slate-600">Browse all available photos for this property.</p>
            </div>
            <button onClick={() => setShowGallery(false)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Close</button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px]">
            <img src={activePhoto || photos[0] || buildPlaceholder()} alt="Property gallery" className="h-[320px] w-full object-cover sm:h-[420px]" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {photos.map((photo, index) => (
              <button key={`${photo}-${index}-gallery`} onClick={() => setActivePhoto(photo)} className={`overflow-hidden rounded-2xl border ${activePhoto === photo ? 'border-teal' : 'border-slate-200'}`}>
                <img src={photo} alt={`Gallery photo ${index + 1}`} className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
