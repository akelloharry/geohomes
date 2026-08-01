"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../context/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import ProtectedRoute from '../../../../components/ProtectedRoute'
import SubmissionForm from '../../../../components/Agent/SubmissionForm'

export default function SubmissionDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['agent']}>
      <SubmissionDetailInner />
    </ProtectedRoute>
  )
}

function SubmissionDetailInner() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const submissionId = params.id
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !submissionId) return
    fetchSubmission()
  }, [user, submissionId])

  async function fetchSubmission() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('agent_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('agent_id', user.id)
      .maybeSingle()

    if (error || !data) {
      setError('Unable to load submission.')
      console.error(error)
    } else {
      setSubmission(data)
    }
    setLoading(false)
  }

  const handleSave = async (values, uploadPhotos) => {
    if (!submission) throw new Error('Submission not loaded')
    if (submission.status !== 'pending_review') {
      throw new Error('Cannot edit a closed submission')
    }

    const { error } = await supabase
      .from('agent_submissions')
      .update({
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
        video_urls: values.video_urls
      })
      .eq('id', submission.id)
      .eq('agent_id', user.id)
      .eq('status', 'pending_review')

    if (error) {
      throw error
    }

    const uploadedUrls = await uploadPhotos(submission.id)
    if (uploadedUrls.length > 0) {
      await supabase
        .from('agent_submissions')
        .update({ photos: uploadedUrls })
        .eq('id', submission.id)
    }

    router.push('/agent/dashboard')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center text-sm text-anchor-gray">Loading submission…</div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center text-sm text-estate-red">{error}</div>
    )
  }

  if (!submission) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center text-sm text-anchor-gray">Submission not found.</div>
    )
  }

  const isEditable = submission.status === 'pending_review'

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="mb-8 rounded-[28px] border border-pale-steel bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Submission details</p>
            <h1 className="mt-3 text-3xl font-bold text-deep-maritime">{submission.address}</h1>
          </div>
          <button
            onClick={() => router.push('/agent/dashboard')}
            className="rounded-full border border-slate-200 bg-cloud-white px-5 py-3 text-sm font-semibold text-deep-maritime hover:bg-cloud-white/90"
          >
            Back to dashboard
          </button>
        </div>
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-cloud-white p-4 text-sm text-anchor-gray">
          Current status: <span className="font-semibold text-deep-maritime">{submission.status.replace('_', ' ')}</span>
          {submission.status !== 'pending_review' && (
            <div className="mt-2 text-xs text-slate-500">Closed submissions cannot be edited.</div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-pale-steel bg-white p-8 shadow-sm">
        {isEditable ? (
          <SubmissionForm initialData={submission} onSaved={handleSave} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4 rounded-[24px] border border-slate-200 bg-cloud-white p-6">
                <h2 className="text-xl font-semibold text-deep-maritime">Property details</h2>
                <div className="grid gap-3 text-sm text-anchor-gray">
                  <div><span className="font-semibold text-deep-maritime">Type:</span> {submission.property_type}</div>
                  <div><span className="font-semibold text-deep-maritime">Rent:</span> KES {submission.rent?.toLocaleString()}</div>
                  <div><span className="font-semibold text-deep-maritime">Deposit:</span> KES {submission.deposit?.toLocaleString()}</div>
                  <div><span className="font-semibold text-deep-maritime">Bedrooms:</span> {submission.bedrooms}</div>
                  <div><span className="font-semibold text-deep-maritime">Bathrooms:</span> {submission.bathrooms}</div>
                  <div><span className="font-semibold text-deep-maritime">Furnished:</span> {submission.furnished ? 'Yes' : 'No'}</div>
                  <div><span className="font-semibold text-deep-maritime">Address:</span> {submission.address}</div>
                </div>
              </div>
              <div className="space-y-4 rounded-[24px] border border-slate-200 bg-cloud-white p-6">
                <h2 className="text-xl font-semibold text-deep-maritime">Landlord</h2>
                <div className="grid gap-3 text-sm text-anchor-gray">
                  <div><span className="font-semibold text-deep-maritime">Name:</span> {submission.landlord_name}</div>
                  <div><span className="font-semibold text-deep-maritime">Phone:</span> {submission.landlord_phone}</div>
                  <div><span className="font-semibold text-deep-maritime">Notes:</span> {submission.notes || 'None'}</div>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-6">
              <h2 className="text-xl font-semibold text-deep-maritime">Selected location</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-anchor-gray">
                <div className="rounded-2xl bg-white p-4 shadow-sm">Latitude: {submission.lat}</div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">Longitude: {submission.lng}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
