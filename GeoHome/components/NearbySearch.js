"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Map from './Map'
import PropertyCard from './PropertyCard'

const defaultCenter = [34.7617, -0.0917]
const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function formatResultLabel(result) {
  return result.place_name || result.text || 'Selected area'
}

export default function NearbySearch() {
  const [center, setCenter] = useState(defaultCenter)
  const [pinLocation, setPinLocation] = useState(defaultCenter)
  const [radius, setRadius] = useState(3000)
  const [searchMode, setSearchMode] = useState('radius')
  const [distanceMode, setDistanceMode] = useState('straight')
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [bbox, setBbox] = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [driveTimes, setDriveTimes] = useState({})
  const [loadingDrive, setLoadingDrive] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [center, radius, searchMode, bbox])

  useEffect(() => {
    if (distanceMode === 'driving' && properties.length) {
      fetchDrivingTimes()
    } else {
      setDriveTimes({})
    }
  }, [distanceMode, properties, center])

  async function loadProperties() {
    setError('')
    if (searchMode === 'area' && !bbox) {
      setError('Area search requires selecting a place with a region. Switch to radius search or choose a place with a bounding box.')
      setProperties([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      let data = []
      if (searchMode === 'area') {
        const { data: bboxData, error: bboxError } = await supabase.rpc('properties_in_bbox', {
          min_lng: bbox.minLng,
          min_lat: bbox.minLat,
          max_lng: bbox.maxLng,
          max_lat: bbox.maxLat
        })
        if (bboxError) throw bboxError
        data = bboxData || []
      } else {
        const { data: nearbyData, error: nearbyError } = await supabase.rpc('nearby_properties', {
          lat_param: center[1],
          lng_param: center[0],
          radius
        })
        if (nearbyError) throw nearbyError
        data = nearbyData || []
      }
      setProperties((data || []).filter((property) => property.verification_status === 'verified' && (property.available ?? true)))
    } catch (err) {
      console.error('Nearby search failed:', err)
      setError(err.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  async function fetchDrivingTimes() {
    setLoadingDrive(true)
    const nextDriveTimes = {}
    for (const property of properties) {
      const lat = property.lat ?? property.latitude
      const lng = property.lng ?? property.longitude
      if (lat == null || lng == null || !property.id) continue
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${center[0]},${center[1]};${lng},${lat}?overview=false`)
        const json = await res.json()
        if (json.routes?.[0]?.duration != null) {
          nextDriveTimes[property.id] = Math.round(json.routes[0].duration / 60)
        }
      } catch (err) {
        console.error('OSRM route error', err)
      }
    }
    setDriveTimes(nextDriveTimes)
    setLoadingDrive(false)
  }

  async function searchPlaces(query) {
    if (!query) return
    if (!mapboxToken) {
      setError('Mapbox geocoding unavailable. Set NEXT_PUBLIC_MAPBOX_TOKEN to use place search.')
      return
    }
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=ke&types=place,locality,neighborhood,district,address`)
      const json = await response.json()
      setSearchResults(json.features || [])
    } catch (err) {
      console.error('Mapbox geocoding failed:', err)
      setSearchResults([])
      setError('Unable to search places right now. Please try again later.')
    }
  }

  const handleResultSelect = (result) => {
    const [lng, lat] = result.center || []
    if (lng == null || lat == null) return
    setCenter([lng, lat])
    setPinLocation([lng, lat])
    setSearchText(formatResultLabel(result))
    setSearchResults([])
    if (result.bbox && result.bbox.length === 4) {
      setBbox({ minLng: result.bbox[0], minLat: result.bbox[1], maxLng: result.bbox[2], maxLat: result.bbox[3] })
      setSearchMode('area')
    } else {
      setBbox(null)
      setSearchMode('radius')
    }
  }

  const handleMapClick = ([lng, lat]) => {
    setCenter([lng, lat])
    setPinLocation([lng, lat])
    setSearchMode('radius')
    setBbox(null)
  }

  const handleRadiusChange = (value) => {
    setRadius(value)
    setSearchMode('radius')
    setBbox(null)
  }

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-lg">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-deep-maritime">Nearby verified rentals</h2>
            <p className="mt-2 text-sm text-anchor-gray">Search by radius or by area selection. Use driving time or straight-line distance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-anchorGray">Search mode</label>
            <select
              value={searchMode}
              onChange={(e) => {
                const nextMode = e.target.value
                if (nextMode === 'area' && !bbox) {
                  setError('Area search requires selecting a place with a bounding box.')
                  return
                }
                setError('')
                setSearchMode(nextMode)
              }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="radius">Radius</option>
              <option value="area">Area</option>
            </select>
            <label className="text-sm text-anchorGray">Distance type</label>
            <select value={distanceMode} onChange={(e) => setDistanceMode(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="straight">Straight line</option>
              <option value="driving">Driving time</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr]">
          <form onSubmit={(e) => { e.preventDefault(); searchPlaces(searchText) }} className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchText}
                placeholder="Search neighbourhood, place, or landmark"
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-full border border-pale-steel px-5 py-3 text-sm text-anchor-gray focus:border-official-teal focus:outline-none focus:ring-2 focus:ring-official-teal/20"
              />
              <button type="submit" className="rounded-full bg-official-teal px-6 py-3 text-sm font-semibold text-white hover:bg-muted-teal">Search</button>
            </div>
            {searchResults.length > 0 && (
              <div className="grid gap-2 rounded-3xl border bg-slate-50 p-3">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full rounded-2xl px-4 py-3 text-left text-sm text-anchorGray hover:bg-slate-100"
                    onClick={() => handleResultSelect(result)}
                  >
                    <div className="font-semibold text-deep-maritime">{formatResultLabel(result)}</div>
                    <div className="text-xs text-slate-500">{result.place_type?.join(', ')}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-anchorGray">
                Radius
                <select value={radius} onChange={(e) => handleRadiusChange(Number(e.target.value))} className="mt-2 w-full rounded-3xl border px-4 py-3 text-sm">
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                </select>
              </label>
              <button
                type="button"
                onClick={loadProperties}
                className="mt-2 w-full rounded-full bg-official-teal px-5 py-3 text-sm font-semibold text-white"
              >
                Refresh search
              </button>
            </div>
          </form>

          <div className="rounded-[24px] overflow-hidden border">
            <Map
              center={center}
              properties={properties}
              bbox={searchMode === 'area' ? bbox : null}
              pinLocation={pinLocation}
              draggable
              onPinMove={(loc) => {
                setPinLocation(loc)
                setCenter(loc)
                setSearchMode('radius')
                setBbox(null)
              }}
              onMapClick={handleMapClick}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-4">
          {loading && <div className="rounded-lg bg-cloud-white p-4 text-sm text-anchor-gray">Loading listings…</div>}
          {error && <div className="rounded-lg bg-estate-red/10 border border-estate-red p-4 text-sm text-estate-red">{error}</div>}
          {!loading && !error && properties.length === 0 && <div className="rounded-lg bg-cloud-white p-4 text-sm text-anchor-gray">No nearby rentals found for this search.</div>}
          {!loading && properties.map((property) => (
            <PropertyCard key={property.id} property={{ ...property, driveMinutes: driveTimes[property.id] }} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border bg-white p-6">
            <h3 className="font-semibold">Search summary</h3>
            <div className="mt-4 space-y-2 text-sm text-anchorGray">
              <div>Mode: {searchMode === 'area' ? 'Area (bbox)' : 'Radius'}</div>
              <div>Radius: {radius} m</div>
              <div>Distance type: {distanceMode === 'driving' ? 'Driving time' : 'Straight line'}</div>
              <div>Center: {center[1].toFixed(5)}, {center[0].toFixed(5)}</div>
              {searchMode === 'area' && bbox && (
                <div>Bbox: {bbox.minLat.toFixed(5)}, {bbox.minLng.toFixed(5)} → {bbox.maxLat.toFixed(5)}, {bbox.maxLng.toFixed(5)}</div>
              )}
              {loadingDrive && distanceMode === 'driving' && <div>Loading drive times…</div>}
            </div>
          </div>
          <div className="rounded-3xl border bg-white p-6">
            <h3 className="font-semibold">Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-anchorGray list-disc list-inside">
              <li>Click the map to set a search point, or drag the pin to move it.</li>
              <li>Use area search for a neighbourhood instead of a fixed radius.</li>
              <li>Driving mode estimates travel time from the search point to each property.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
