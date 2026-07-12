'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ContactModal({ isOpen, onClose, property, landlord, user }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setError('')
      setSent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a message before sending.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.from('inquiries').insert({
        property_id: property.id,
        landlord_id: landlord?.id,
        tenant_id: user?.id,
        message: message.trim(),
        status: 'pending'
      })

      if (error) throw error

      setSent(true)
      setTimeout(() => onClose(), 1800)
    } catch (err) {
      console.error(err)
      setError('Unable to send your message right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-[#1E3A4D]">Contact landlord</h2>
        <p className="mt-1 text-sm text-[#5B6F82]">
          Send a note about {property?.title || 'this property'} to {landlord?.full_name || 'the landlord'}.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          className="mt-4 min-h-[120px] w-full rounded-2xl border border-[#BECCD9] p-3 focus:outline-none focus:ring-2 focus:ring-[#2C6E5C]"
          disabled={loading || sent}
        />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading || sent || !message.trim()}
            className="flex-1 rounded-full bg-[#2C6E5C] px-6 py-2 font-semibold text-white transition hover:bg-[#23594a] disabled:opacity-50"
          >
            {loading ? 'Sending...' : sent ? 'Sent ✓' : 'Send message'}
          </button>
          <button onClick={onClose} className="rounded-full border border-[#BECCD9] px-4 py-2 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
