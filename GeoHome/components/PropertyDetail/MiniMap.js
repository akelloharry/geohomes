'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getRoute } from '../../lib/directions'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function MiniMap({ property, hasPass }) {
  const mapContainer = useRef(null)
  const mapInstance = useRef(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [originInput, setOriginInput] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)

  const propertyCoords = [
    property?.lng ?? property?.longitude ?? property?.location?.coordinates?.[0] ?? 34.7617,
    property?.lat ?? property?.latitude ?? property?.location?.coordinates?.[1] ?? -0.0917
  ]

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude])
      },
      () => null
    )
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: propertyCoords,
      zoom: 14,
      interactive: false,
      attributionControl: false
    })

    mapInstance.current = map
    new mapboxgl.Marker({ color: '#2C6E5C' }).setLngLat(propertyCoords).addTo(map)

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [propertyCoords.join(',')])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return
    setRouteLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLocation = [pos.coords.longitude, pos.coords.latitude]
        setUserLocation(nextLocation)
        setOriginInput('')
        setRouteLoading(false)
      },
      () => setRouteLoading(false)
    )
  }

  const handleRouteRequest = async () => {
    if (!hasPass || !mapInstance.current) return

    const origin = originInput.trim() || userLocation
    if (!origin) return

    setRouteLoading(true)
    if (typeof origin === 'string') {
      const encoded = encodeURIComponent(origin)
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encoded}&destination=${propertyCoords[1]},${propertyCoords[0]}`, '_blank')
      setRouteLoading(false)
      return
    }

    try {
      const info = await getRoute(origin, propertyCoords, mapInstance.current)
      if (info) setRouteInfo(info)
    } catch (err) {
      console.error(err)
    } finally {
      setRouteLoading(false)
    }
  }

  const openDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${propertyCoords[1]},${propertyCoords[0]}`, '_blank')
  }

  return (
    <div>
      <div ref={mapContainer} className="h-48 w-full rounded-2xl border border-slate-200" />
      {hasPass ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={originInput}
              onChange={(event) => setOriginInput(event.target.value)}
              placeholder="Enter origin or leave blank"
              className="flex-1 min-w-[160px] rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="rounded-full border border-[#2C6E5C] px-3 py-2 text-sm font-semibold text-[#2C6E5C]"
            >
              {routeLoading ? 'Working…' : 'Use my location'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[#5B6F82]">
            <div>{routeInfo ? `Route: ${routeInfo.distance} · ${routeInfo.duration}` : 'Use an origin to show route details'}</div>
            <button type="button" onClick={openDirections} className="font-semibold text-[#2C6E5C] hover:underline">
              Get directions →
            </button>
          </div>
          <button
            type="button"
            onClick={handleRouteRequest}
            className="w-full rounded-full bg-[#2C6E5C] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#23594a] disabled:opacity-60"
            disabled={routeLoading}
          >
            {routeLoading ? 'Finding route…' : 'Show route'}
          </button>
        </div>
      ) : (
        <div className="mt-2 text-sm text-[#5B6F82]">Buy a pass to unlock property directions and route details.</div>
      )}
    </div>
  )
}
