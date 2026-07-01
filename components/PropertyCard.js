import Link from 'next/link'

export default function PropertyCard({ property }) {
  if (!property) return null
  const price = property.price ?? property.rent_price ?? property.min_rent ?? (property.units?.[0]?.rent_price) ?? ''
  const address = property.address ?? ''
  const bedrooms = property.bedrooms ?? property.num_bedrooms ?? ''
  const photos = property.photos ?? property.images ?? property.image_urls ?? []
  const available = property.available ?? true

  return (
    <div className="overflow-hidden rounded-[24px] border border-pale-steel bg-white shadow-sm">
      <img src={photos?.[0] || property.image_url || '/placeholder.svg'} alt="property" className="h-48 w-full object-cover" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-deep-maritime">{property.title || 'Property'}</h3>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${available === false ? 'bg-estate-red/15 text-estate-red' : property.sponsored ? 'bg-muted-teal/15 text-muted-teal' : 'bg-mint-hint text-official-teal'}`}>
            {available === false ? 'Unavailable' : property.sponsored ? 'Sponsored' : 'Available'}
          </span>
        </div>
        {address && <p className="mt-1 text-sm text-anchor-gray">{address}</p>}
        <p className="mt-2 text-sm text-anchor-gray">{bedrooms} bd • KES {price}</p>
        {property.distance && <p className="text-sm text-anchor-gray">{property.distance.toFixed(1)}m away</p>}
        <div className="mt-3">
          <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-official-teal hover:text-deep-maritime">View details</Link>
        </div>
      </div>
    </div>
  )
}
