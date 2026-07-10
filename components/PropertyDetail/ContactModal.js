'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ContactModal({ isOpen, onClose, property, landlord, user }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) return
    setLoading(true)

    const { error } = await supabase.from('inquiries').insert({
      property_id: property.id,
      landlord_id: landlord?.id,
      tenant_id: user?.id,
      message: message.trim(),
      status: 'pending'
    })

    setLoading(false)
    if (!error) {
      setSent(true)
      setTimeout(() => onClose(), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h2 className="font-heading text-xl font-bold text-[#1E3A4D]">Contact Landlord</h2>
        <p className="text-[#5B6F82] text-sm mt-1">Send a message to {landlord?.first_name || 'the landlord'} about {property.title}</p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          className="w-full mt-4 p-3 border border-[#BECCD9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2C6E5C] min-h-[100px]"
          disabled={loading || sent}
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || sent || !message.trim()}
            className="flex-1 px-6 py-2 bg-[#2C6E5C] text-white font-semibold rounded-lg hover:bg-[#23594a] transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : sent ? 'Sent ✓' : 'Send Message'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#BECCD9] rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
