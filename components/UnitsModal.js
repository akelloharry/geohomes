"use client"

import { useEffect, useState } from 'react'
import Modal from './Modal'
import AvailabilityCalendar from './AvailabilityCalendar'
import { supabase } from '../lib/supabaseClient'

export default function UnitsModal({ propertyId, open, onClose }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !propertyId) return
    fetchUnits()
  }, [open, propertyId])

  async function fetchUnits() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('units').select('*').eq('property_id', propertyId)
      if (error) {
        console.error('fetchUnits error', error)
        setUnits([])
      } else {
        const list = (data || []).slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setUnits(list)
      }
    } catch (e) {
      console.error('fetchUnits exception', e)
      setUnits([])
    }
    setLoading(false)
  }

  async function toggleVacancy(unit) {
    const { error } = await supabase.from('units').update({ is_vacant: !unit.is_vacant }).eq('id', unit.id)
    if (error) return alert('Failed to update vacancy')
    fetchUnits()
  }

  async function toggleDate(unit, isoDate) {
    const date = new Date(isoDate).toISOString().slice(0,10)
    const existing = unit.booked_dates || []
    const set = new Set(existing.map(d => d.toString()))
    if (set.has(date)) {
      // remove
      const next = existing.filter(d => new Date(d).toISOString().slice(0,10) !== date)
      const { error } = await supabase.from('units').update({ booked_dates: next }).eq('id', unit.id)
      if (error) return alert('Failed to update bookings')
    } else {
      const next = [...existing, date]
      const { error } = await supabase.from('units').update({ booked_dates: next }).eq('id', unit.id)
      if (error) return alert('Failed to update bookings')
    }
    fetchUnits()
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Units</h3>
            <p className="text-sm text-anchorGray">Manage units and vacancies for this property.</p>
          </div>
          <button className="text-sm text-anchorGray" onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <div className="text-sm text-anchorGray">Loading units…</div>
        ) : units.length === 0 ? (
          <div className="rounded-3xl border border-dashed p-4 text-sm text-anchorGray">No units found.</div>
        ) : (
          <div className="space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-3xl border p-4 bg-cloud">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{unit.name || 'Unit'}</div>
                    <div className="text-sm text-anchorGray">{unit.property_type} • {unit.bedrooms} bd • {unit.bathrooms} ba</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${unit.is_vacant ? 'bg-mintHint text-teal' : 'bg-estateRed/10 text-estateRed'}`}>{unit.is_vacant ? 'Vacant' : 'Booked'}</span>
                    <button className="rounded-full border px-3 py-1 text-sm" onClick={() => toggleVacancy(unit)}>{unit.is_vacant ? 'Mark booked' : 'Mark vacant'}</button>
                  </div>
                </div>

                {unit.property_type === 'BnB unit' && (
                  <div className="mt-3">
                    <AvailabilityCalendar bookedDates={unit.booked_dates || []} onToggleDate={(iso) => toggleDate(unit, iso)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
