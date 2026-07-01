"use client"

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function Map({ center = [34.7617, -0.0917], properties = [], zoom = 13, className = '', onMarkerClick, onPinMove, draggable = false, pinLocation }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const pinRef = useRef(null)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom,
      attributionControl: false
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right')
  }, [center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    try {
      if (typeof map.isStyleLoaded === 'function' && !map.isStyleLoaded()) {
        map.once('load', () => {
          try {
            map.setCenter(center)
            map.setZoom(zoom)
          } catch (error) {
            console.warn('map.setCenter failed after load', error)
          }
        })
      } else {
        try {
          map.setCenter(center)
          map.setZoom(zoom)
        } catch (error) {
          console.warn('map.setCenter failed', error)
        }
      }
    } catch (error) {
      console.warn('Map defensive setCenter failed', error)
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    console.log(`Map rendering with ${properties.length} properties`)
    properties.forEach((property) => {
      const lat = property.lat ?? property.latitude ?? (property.location && property.location.coordinates ? property.location.coordinates[1] : null)
      const lng = property.lng ?? property.longitude ?? (property.location && property.location.coordinates ? property.location.coordinates[0] : null)
      
      if (lat == null || lng == null) {
        console.warn('Property missing coordinates:', property.id, property)
        return
      }

      console.log(`Adding marker for property ${property.id} at [${lng}, ${lat}]`)

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

      const title = property.title || 'Property'
      const address = property.address || ''
      const price = property.price != null ? `KES ${property.price}` : ''
      const bedrooms = property.bedrooms != null ? `${property.bedrooms} bd` : ''
      const bathrooms = property.bathrooms != null ? `${property.bathrooms} ba` : ''
      const propertyType = property.property_type || property.type || ''
      const details = [address, price, bedrooms, bathrooms, propertyType].filter(Boolean).join(' • ')
      const popupHtml = `
        <div style="font-size:13px;line-height:1.5;max-width:240px;color:#1E3A4D;">
          <strong style="display:block;margin-bottom:6px;font-family:Merriweather,serif;color:#2C6E5C;">${title}</strong>
          <div style="margin-bottom:8px;">${details}</div>
          <a href="/properties/${property.id}" style="color:#2C6E5C;text-decoration:none;font-weight:700;">View details</a>
        </div>`
      marker.setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(popupHtml))

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
  }, [center, properties, zoom, pinLocation, draggable, onPinMove, onMarkerClick])

  return <div ref={mapContainer} className={`h-96 w-full rounded-[24px] ${className}`.trim()} />
}
