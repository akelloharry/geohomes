import Link from 'next/link'

export default function PropertyHeader({ property, locationPath }) {
  return (
    <div className="mb-6">
      <Link href="/map" className="text-[#2C6E5C] font-semibold hover:underline">
        ← Back to Map
      </Link>
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1E3A4D] mt-2">
        {property.title}
      </h1>
      {locationPath && (
        <div className="text-sm text-[#5F8A7B] mt-1">{locationPath}</div>
      )}
      <div className="text-[#5B6F82]">{property.address}</div>
      {property.verification_status === 'verified' && (
        <span className="inline-block mt-2 bg-[#14B8A6] text-white text-xs font-semibold px-3 py-1 rounded-full">
          GeoHome Verified
        </span>
      )}
    </div>
  )
}
