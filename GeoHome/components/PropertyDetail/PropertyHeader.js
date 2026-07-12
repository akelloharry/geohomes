import Link from 'next/link'

export default function PropertyHeader({ property, locationPath }) {
  return (
    <div className="mb-6">
      <Link href="/map" className="font-semibold text-[#2C6E5C] hover:underline">
        ← Back to map
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-[#1E3A4D] md:text-3xl">{property.title}</h1>
      {locationPath ? <div className="mt-1 text-sm text-[#5F8A7B]">{locationPath}</div> : null}
      <div className="text-[#5B6F82]">{property.address}</div>
      {property.verification_status === 'verified' ? (
        <span className="mt-2 inline-block rounded-full bg-[#14B8A6] px-3 py-1 text-xs font-semibold text-white">
          GeoHome Verified
        </span>
      ) : null}
    </div>
  )
}
