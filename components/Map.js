"use client"

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

if (!mapboxToken) {
  console.error('⚠️ Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) is missing!')
}

mapboxgl.accessToken = mapboxToken || ''

export default function Map({ center = [34.7617, -0.0917], properties = [], zoom = 13, className = '', onMarkerClick, onPinMove, draggable = false, pinLocation, hasPass = false, onRequestPass }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const pinRef = useRef(null)
  const effectiveZoom = hasPass ? zoom : Math.min(zoom, 12)
  const maxZoom = hasPass ? 18 : 12

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center rounded-[24px] bg-cloud-white ${className}`.trim()}>
        <p className="text-sm text-anchor-gray">Map configuration error. Please check environment variables.</p>
      </div>
    )
  }

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: effectiveZoom,
      maxZoom,
      attributionControl: false
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right')
  }, [center, effectiveZoom, maxZoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    try {
      map.setMaxZoom(maxZoom)
      if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
        map.once('load', () => {
          try {
            map.setCenter(center)
            map.setZoom(effectiveZoom)
          } catch (error) {
            console.warn('map.setCenter failed after load', error)
          }
        })
      } else {
        try {
          map.setCenter(center)
          map.setZoom(effectiveZoom)
        } catch (error) {
          console.warn('map.setCenter failed', error)
        }
      }
    } catch (error) {
      console.warn('Map defensive setCenter failed', error)
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    properties.forEach((property, index) => {
      const lat = property.lat ?? property.latitude ?? (property.location && property.location.coordinates ? property.location.coordinates[1] : null)
      const lng = property.lng ?? property.longitude ?? (property.location && property.location.coordinates ? property.location.coordinates[0] : null)

      if (lat == null || lng == null) {
        return
      }

      const markerElement = document.createElement('div')
      markerElement.className = 'marker'
      markerElement.style.width = '22px'
      markerElement.style.height = '22px'
      markerElement.style.borderRadius = '50%'
      markerElement.style.border = '2px solid #F4F6F9'
      markerElement.style.cursor = 'pointer'
      markerElement.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.16)'
      const available = property.available ?? true
      const color = property.sponsored ? '#FBBF24' : (available === false ? '#B26A5C' : '#5F8A7B')
      markerElement.style.background = color

      const marker = new mapboxgl.Marker(markerElement).setLngLat([lng, lat]).addTo(map)
      const title = hasPass ? (property.title || 'Property') : 'Property Available'
      const address = property.address || ''
      const price = property.price != null ? `KES ${property.price}` : ''
      const propertyType = property.property_type || property.type || ''
      const details = [address, price, propertyType].filter(Boolean).join(' • ')
      const popupHtml = `
        <div style="font-size:13px;line-height:1.5;max-width:240px;color:#1E3A4D;">
          <strong style="display:block;margin-bottom:6px;font-family:Merriweather,serif;color:#2C6E5C;">${title}</strong>
          <div style="margin-bottom:8px;">${details}</div>
          ${hasPass ? `<a href="/properties/${property.id}" style="color:#2C6E5C;text-decoration:none;font-weight:700;">View details</a>` : `<button type="button" class="map-pass-cta" style="background:#2C6E5C;color:#fff;border:none;border-radius:999px;padding:8px 12px;font-weight:600;cursor:pointer;">Buy Pass to View Details</button>`}
        </div>`
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml)
      marker.setPopup(popup)

      popup.on('open', () => {
        const cta = popup.getElement()?.querySelector('.map-pass-cta')
        if (cta) {
          cta.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            onRequestPass?.()
          })
        }
      })

      if (onMarkerClick) {
        markerElement.addEventListener('click', () => onMarkerClick(property))
      }

      markersRef.current.push(marker)
    })

    if (pinLocation) {
      if (pinRef.current) {
        pinRef.current.setLngLat([pinLocation[0], pinLocation[1]])
      } else {
        const pinElement = document.createElement('div')
        pinElement.className = 'pin'
        pinElement.style.width = '28px'
        pinElement.style.height = '28px'
        pinElement.style.background = '#1E3A4D'
        pinElement.style.borderRadius = '50%'
        pinElement.style.border = '3px solid #F4F6F9'
        pinRef.current = new mapboxgl.Marker({ element: pinElement, draggable }).setLngLat([pinLocation[0], pinLocation[1]]).addTo(map)
        if (draggable) {
          pinRef.current.on('dragend', () => {
            const lngLat = pinRef.current.getLngLat()
            onPinMove?.([lngLat.lng, lngLat.lat])
          })
        }
      }
    }

    if (onMarkerClick) {
      const handleMapClick = (event) => {
        onMarkerClick([event.lngLat.lng, event.lngLat.lat])
      }
      map.on('click', handleMapClick)
      return () => {
        map.off('click', handleMapClick)
      }
    }
  }, [center, properties, effectiveZoom, maxZoom, pinLocation, draggable, onPinMove, onMarkerClick, hasPass, onRequestPass])

  return <div ref={mapContainer} className={`h-96 w-full rounded-[24px] ${className}`.trim()} />
}
