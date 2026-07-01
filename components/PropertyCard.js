import Link from 'next/link'

export default function PropertyCard({ property }) {
  if (!property) return null
  // normalize common fields
  const price = property.price ?? property.rent_price ?? property.min_rent ?? (property.units?.[0]?.rent_price) ?? ''
  const address = property.address ?? ''
  const bedrooms = property.bedrooms ?? property.num_bedrooms ?? ''
  const photos = property.photos ?? property.images ?? property.image_urls ?? []
  const available = property.available ?? true

  return (
    <div className="border rounded shadow-sm overflow-hidden bg-white">
      <img src={photos?.[0] || property.image_url || '/placeholder.svg'} alt="property" className="w-full h-48 object-cover" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-midnight">{property.title || 'Property'}</h3>
          <span className={`text-xs uppercase px-2 py-1 rounded ${available === false ? 'bg-estateRed/15 text-estateRed' : property.sponsored ? 'bg-mutedTeal/15 text-mutedTeal' : 'bg-mintHint text-teal'}`}>
            {available === false ? 'Unavailable' : property.sponsored ? 'Sponsored' : 'Available'}
          </span>
        </div>
        {address && <p className="text-sm text-anchorGray mt-1">{address}</p>}
        <p className="text-sm text-anchorGray mt-2">{bedrooms} bd • KES {price}</p>
        {property.distance && <p className="text-sm text-anchorGray">{property.distance.toFixed(1)}m away</p>}
        <div className="mt-3">
          <Link href={`/properties/${property.id}`} className="text-sm text-teal font-medium">View details</Link>
        </div>
      </div>
    </div>
  )
}
