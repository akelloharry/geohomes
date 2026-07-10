'use client'

import { useState } from 'react'

export default function Description({ description }) {
  const [isExpanded, setIsExpanded] = useState(false)
  if (!description) return null

  const truncated = description.length > 150 ? description.slice(0, 150) + '...' : description

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-[#1E3A4D] mb-2">Description</h3>
      <p className="text-[#5B6F82] leading-relaxed">
        {isExpanded ? description : truncated}
      </p>
      {description.length > 150 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#2C6E5C] font-semibold hover:underline mt-1"
        >
          {isExpanded ? 'Read Less ←' : 'Read More →'}
        </button>
      )}
    </div>
  )
}
