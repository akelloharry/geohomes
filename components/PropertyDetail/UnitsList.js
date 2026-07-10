import Link from 'next/link'

function UnitCard({ unit, propertyId, hasPass, occupied }) {
  return (
    <div className={`border rounded-lg p-4 ${occupied ? 'bg-[#F4F6F9] opacity-80' : 'bg-white'}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <div className="font-semibold text-[#1E3A4D]">
            {unit.unit_number || unit.name || 'Unit'}{unit.unit_name ? ` · ${unit.unit_name}` : ''}
          </div>
          <div className="text-sm text-[#5B6F82] mt-1">
            {unit.bedrooms ?? '—'} bed · {unit.bathrooms ?? '—'} bath · {unit.furnished ? 'Furnished' : 'Unfurnished'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[#2C6E5C]">KES {(unit.price ?? unit.rent_price ?? 0).toLocaleString()}</div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${occupied ? 'bg-[#BECCD9] text-[#5B6F82]' : 'bg-[#D9E8E2] text-[#2C6E5C]'}`}>
            {occupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
      </div>
      {hasPass && !occupied && (
        <Link href={`/properties/${propertyId}/units/${unit.id}`} className="inline-block mt-3 text-[#2C6E5C] font-semibold text-sm hover:underline">
          View Unit →
        </Link>
      )}
    </div>
  )
}

export default function UnitsList({ units, propertyId, hasPass }) {
  if (!units || units.length === 0) return null

  const vacantUnits = units.filter((u) => u.is_vacant ?? true)
  const occupiedUnits = units.filter((u) => !(u.is_vacant ?? true))

  return (
    <div className="mt-6">
      <h3 className="font-heading text-lg font-semibold text-[#1E3A4D] mb-3">Available Units ({vacantUnits.length})</h3>
      <div className="space-y-3">
        {vacantUnits.map((unit) => (
          <UnitCard key={unit.id} unit={unit} propertyId={propertyId} hasPass={hasPass} />
        ))}
        {occupiedUnits.length > 0 && (
          <details className="mt-2">
            <summary className="text-sm text-[#5B6F82] cursor-pointer hover:text-[#2C6E5C]">Show occupied units ({occupiedUnits.length})</summary>
            <div className="mt-2 space-y-3">
              {occupiedUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} propertyId={propertyId} hasPass={hasPass} occupied />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
