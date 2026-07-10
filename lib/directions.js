import mapboxgl from 'mapbox-gl'

export async function getRoute(origin, destination, map) {
  if (!origin || !destination || !map) {
    return null
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    console.error('Mapbox token is missing for directions')
    return null
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${token}&geometries=geojson&overview=full`
  const response = await fetch(url)
  const data = await response.json()

  if (!data?.routes?.length) {
    return null
  }

  const route = data.routes[0]
  const sourceId = 'property-route-source'
  const layerId = 'property-route-layer'
  const routeData = {
    type: 'Feature',
    properties: {},
    geometry: route.geometry
  }

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(routeData)
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: routeData
    })
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2C6E5C',
        'line-width': 5,
        'line-opacity': 0.9
      }
    })
  }

  const coordinates = route.geometry.coordinates
  if (coordinates && coordinates.length) {
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
    )
    map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 1000 })
  }

  return {
    distance: `${(route.distance / 1000).toFixed(1)} km`,
    duration: `${Math.round(route.duration / 60)} min`
  }
}
