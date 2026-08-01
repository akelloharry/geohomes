"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import ProtectedRoute from '../../../components/ProtectedRoute'
import SubmissionForm from '../../../components/Agent/SubmissionForm'

export default function AgentSubmitPage() {
  return (
    <ProtectedRoute allowedRoles={['agent']}>
      <AgentSubmitInner />
    </ProtectedRoute>
  )
}

function AgentSubmitInner() {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (!user.id) {
      setError('Unable to determine agent account. Please sign in again.')
    }
  }, [user])

  const handleSave = async (values, uploadPhotos) => {
    if (!user) throw new Error('Not signed in')

    const { data, error } = await supabase
      .from('agent_submissions')
      .insert([
        {
          agent_id: user.id,
          property_type: values.property_type,
          rent: values.rent,
          deposit: values.deposit,
          bedrooms: values.bedrooms,
          bathrooms: values.bathrooms,
          furnished: values.furnished,
          water_supply: values.water_supply,
          electricity: values.electricity,
          parking: values.parking,
          security: values.security,
          backup_power: values.backup_power,
          internet: values.internet,
          address: values.address,
          lat: values.lat,
          lng: values.lng,
          landlord_name: values.landlord_name,
          landlord_phone: values.landlord_phone,
          notes: values.notes,
          photos: values.photos,
          video_urls: values.video_urls,
          status: 'pending_review'
        }
      ])
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('Could not create submission')
    }

    const uploadedUrls = await uploadPhotos(data.id)

    if (uploadedUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('agent_submissions')
        .update({ photos: uploadedUrls })
        .eq('id', data.id)

      if (updateError) {
        console.error(updateError)
      }
    }

    router.push('/agent/dashboard')
  }

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-8 rounded-[28px] border border-pale-steel bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Agent portal</p>
            <h1 className="mt-3 text-3xl font-bold text-deep-maritime">New property submission</h1>
          </div>
          <button
            onClick={() => router.push('/agent/dashboard')}
            className="rounded-full border border-slate-200 bg-cloud-white px-5 py-3 text-sm font-semibold text-deep-maritime hover:bg-cloud-white/90"
          >
            Back to dashboard
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-estate-red/10 bg-estate-red/5 p-6 text-sm text-estate-red">{error}</div>}

      <SubmissionForm onSaved={handleSave} />
    </div>
  )
}
