export default function Amenities({ amenities }) {
  if (!amenities || amenities.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-lg font-semibold text-[#1E3A4D]">Amenities</h3>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity, index) => (
          <span key={`${amenity}-${index}`} className="rounded-full bg-[#E8F2EE] px-3 py-1 text-sm font-medium text-[#2C6E5C]">
            {amenity}
          </span>
        ))}
      </div>
    </div>
  )
}
