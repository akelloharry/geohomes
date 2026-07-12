'use client'

import { useState } from 'react'

export default function Description({ description }) {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!description) return null

  const truncated = description.length > 180 ? `${description.slice(0, 180)}...` : description

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-[#1E3A4D]">Description</h3>
      <p className="leading-relaxed text-[#5B6F82]">{isExpanded ? description : truncated}</p>
      {description.length > 180 && (
        <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 font-semibold text-[#2C6E5C] hover:underline">
          {isExpanded ? 'Read less ←' : 'Read more →'}
        </button>
      )}
    </div>
  )
}
