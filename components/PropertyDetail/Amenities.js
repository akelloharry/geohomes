export default function Amenities({ amenities }) {
  if (!amenities || amenities.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="font-heading text-lg font-semibold text-[#1E3A4D] mb-2">Amenities</h3>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => (
          <span key={amenity} className="bg-[#D9E8E2] text-[#2C6E5C] px-3 py-1 rounded-full text-sm font-medium">
            ✓ {amenity}
          </span>
        ))}
      </div>
    </div>
  )
}
