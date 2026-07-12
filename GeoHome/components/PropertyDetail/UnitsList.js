import Link from 'next/link'

function UnitCard({ unit, propertyId, hasPass, occupied }) {
  return (
    <div className={`rounded-[24px] border p-4 ${occupied ? 'border-slate-200 bg-slate-50 opacity-80' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-[#1E3A4D]">
            {unit.unit_number || unit.name || 'Unit'}{unit.unit_name ? ` · ${unit.unit_name}` : ''}
          </div>
          <div className="mt-1 text-sm text-[#5B6F82]">
            {unit.bedrooms ?? '—'} bed · {unit.bathrooms ?? '—'} bath · {unit.furnished ? 'Furnished' : 'Unfurnished'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-[#2C6E5C]">KES {(unit.price ?? unit.rent_price ?? 0).toLocaleString()}</div>
          <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${occupied ? 'bg-slate-200 text-slate-600' : 'bg-[#D9E8E2] text-[#2C6E5C]'}`}>
            {occupied ? 'Occupied' : 'Vacant'}
          </span>
        </div>
      </div>
      {hasPass && !occupied ? (
        <Link href={`/properties/${propertyId}/units/${unit.id}`} className="mt-3 inline-block text-sm font-semibold text-[#2C6E5C] hover:underline">
          View unit →
        </Link>
      ) : null}
    </div>
  )
}

export default function UnitsList({ units, propertyId, hasPass }) {
  if (!units || units.length === 0) return null

  const vacantUnits = units.filter((unit) => unit.is_vacant ?? true)
  const occupiedUnits = units.filter((unit) => !(unit.is_vacant ?? true))

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1E3A4D]">Available units ({vacantUnits.length})</h3>
      <div className="mt-4 space-y-3">
        {vacantUnits.map((unit) => (
          <UnitCard key={unit.id} unit={unit} propertyId={propertyId} hasPass={hasPass} />
        ))}
        {occupiedUnits.length > 0 ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-[#5B6F82] hover:text-[#2C6E5C]">Show occupied units ({occupiedUnits.length})</summary>
            <div className="mt-2 space-y-3">
              {occupiedUnits.map((unit) => (
                <UnitCard key={unit.id} unit={unit} propertyId={propertyId} hasPass={hasPass} occupied />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  )
}
