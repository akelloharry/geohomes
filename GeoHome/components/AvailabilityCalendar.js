"use client"

import { useMemo, useState } from 'react'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonth(year, month) {
  const start = new Date(year, month, 1)
  const days = []
  const leading = start.getDay()
  for (let i = 0; i < leading; i += 1) days.push(null)
  const total = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= total; i += 1) days.push(new Date(year, month, i))
  return days
}

export default function AvailabilityCalendar({ bookedDates = [], onToggleDate }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const days = useMemo(() => buildMonth(year, month), [year, month])

  const formattedBooked = useMemo(() => new Set(bookedDates.map((date) => new Date(date).toDateString())), [bookedDates])

  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
  }

  return (
    <div className="rounded-3xl border bg-white p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-sm font-semibold">Availability calendar</div>
          <div className="text-xs text-anchorGray">Click dates to toggle booked days.</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-full border px-3 py-1 text-xs" onClick={prevMonth}>Prev</button>
          <button type="button" className="rounded-full border px-3 py-1 text-xs" onClick={nextMonth}>Next</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-anchorGray">
        {weekdays.map((weekday) => <div key={weekday}>{weekday}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {days.map((date, index) => {
          const label = date ? date.getDate() : ''
          const isBooked = date ? formattedBooked.has(date.toDateString()) : false
          return (
            <button
              key={`${date?.toDateString() || 'empty'}-${index}`}
              type="button"
              disabled={!date}
              onClick={() => date && onToggleDate && onToggleDate(date.toISOString())}
              className={`h-12 rounded-2xl border ${date ? 'bg-white' : 'bg-slate-100'} ${isBooked ? 'border-estate-red bg-estate-red/10 text-estate-red' : 'border-slate-200 text-slate-700'} ${date ? 'hover:border-official-teal hover:text-official-teal' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
