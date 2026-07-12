'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getRoute } from '../../lib/directions'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function MiniMap({ property, hasPass }) {
  const mapContainer = useRef(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude])
        setLoading(false)
      },
      () => setLoading(false)
    )
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return

    const [lng, lat] = [property?.lng ?? property?.longitude ?? property?.location?.coordinates?.[0] ?? 34.7617, property?.lat ?? property?.latitude ?? property?.location?.coordinates?.[1] ?? -0.0917]
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: 14,
      interactive: false,
      attributionControl: false
    })

    new mapboxgl.Marker({ color: '#2C6E5C' }).setLngLat([lng, lat]).addTo(map)

    map.on('load', () => {
      if (userLocation && hasPass) {
        getRoute(userLocation, [lng, lat], map).then((info) => {
          if (info) setRouteInfo(info)
        }).catch(() => null)
      }
    })

    return () => map.remove()
  }, [property, userLocation, hasPass])

  const openDirections = () => {
    const [lng, lat] = [property?.lng ?? property?.longitude ?? property?.location?.coordinates?.[0], property?.lat ?? property?.latitude ?? property?.location?.coordinates?.[1]]
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  return (
    <div>
      <div ref={mapContainer} className="h-48 w-full rounded-2xl border border-slate-200" />
      {routeInfo ? (
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="text-[#5B6F82]">🚗 {routeInfo.distance} · {routeInfo.duration}</div>
          <button onClick={openDirections} className="font-semibold text-[#2C6E5C] hover:underline">
            Get directions →
          </button>
        </div>
      ) : !userLocation && !loading ? (
        <div className="mt-2 text-sm text-[#5B6F82]">Enable location to get directions</div>
      ) : null}
    </div>
  )
}
