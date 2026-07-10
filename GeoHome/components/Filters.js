"use client"

import { useState } from 'react'

export default function Filters({ onChange }) {
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [propertyType, setPropertyType] = useState('')

  const apply = () => onChange({ priceMin, priceMax, bedrooms, propertyType })

  return (
    <div className="p-3 bg-white border rounded space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input placeholder="Min price" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="border px-2 py-1" />
        <input placeholder="Max price" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="border px-2 py-1" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input placeholder="Bedrooms" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="border px-2 py-1" />
        <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="border px-2 py-1">
          <option value="">Any type</option>
          <option value="rental">Rental</option>
          <option value="hostel">Hostel</option>
          <option value="bnb">B&B</option>
        </select>
      </div>
      <button onClick={apply} className="bg-official-teal text-white px-3 py-2 rounded">Apply filters</button>
    </div>
  )
}
