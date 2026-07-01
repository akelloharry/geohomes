"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Map from './Map'
import PropertyCard from './PropertyCard'

export default function NearbySearch() {
  const center = [34.7617, -0.0917]
  const [radius, setRadius] = useState(3000)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNearby()
  }, [radius])

  async function fetchNearby() {
    setLoading(true)
    setError('')
    const payload = { lat_param: center[1], lng_param: center[0], radius }
    console.log('Calling RPC nearby_properties with payload:', payload)
    const { data, error } = await supabase.rpc('nearby_properties', payload)
    if (error) {
      console.error('nearby_properties RPC error:', error)
      setError(error.message || JSON.stringify(error))
      setProperties([])
    } else {
      const filtered = (data || []).filter((property) => property.verification_status === 'verified' && (property.available ?? true))
      setProperties(filtered)
    }
    setLoading(false)
  }

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Nearby verified rentals</h2>
          <p className="mt-2 text-sm text-anchorGray">Loaded from Supabase RPC. Adjust the radius to refresh results near Kisumu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-anchorGray">Radius</label>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="border rounded px-3 py-2 text-sm">
            <option value={1000}>1 km</option>
            <option value={2000}>2 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
          </select>
          <button onClick={fetchNearby} className="bg-teal text-white rounded px-4 py-2 text-sm">Reload</button>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-[24px] overflow-hidden border">
          <Map center={center} properties={properties} />
        </div>
        <div className="space-y-4">
          {loading && <div className="rounded-lg bg-cloud p-4 text-sm text-anchorGray">Loading nearby listings...</div>}
          {error && <div className="rounded-lg bg-estateRed/10 border border-estateRed p-4 text-sm text-estateRed">{error}</div>}
          {!loading && !error && properties.length === 0 && <div className="rounded-lg bg-cloud p-4 text-sm text-anchorGray">No nearby rentals found for this radius.</div>}
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  )
}
