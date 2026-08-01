"use client"

import { useState } from 'react'
import Map from '../Map'

export default function LocationPicker({ value = [-0.0917, 34.7617], onChange }) {
  const [position, setPosition] = useState(value)

  const handleMapClick = (coords) => {
    setPosition(coords)
    onChange?.(coords)
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Location</p>
          <p className="text-sm text-slate-600">Click the map to choose the property location.</p>
        </div>
        <div className="rounded-full bg-cloud-white px-3 py-1 text-xs font-semibold text-anchor-gray">Draggable pin</div>
      </div>
      <div className="h-72 overflow-hidden rounded-[20px] border border-slate-200">
        <Map
          center={[position[0], position[1]]}
          zoom={11}
          className="h-full w-full"
          onMapClick={handleMapClick}
          draggable={true}
          pinLocation={[position[0], position[1]]}
          onPinMove={(coords) => {
            setPosition(coords)
            onChange?.(coords)
          }}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-cloud-white p-3 text-sm text-anchor-gray">
          <div className="font-semibold text-deep-maritime">Latitude</div>
          <div>{position[1].toFixed(6)}</div>
        </div>
        <div className="rounded-2xl bg-cloud-white p-3 text-sm text-anchor-gray">
          <div className="font-semibold text-deep-maritime">Longitude</div>
          <div>{position[0].toFixed(6)}</div>
        </div>
      </div>
    </div>
  )
}
