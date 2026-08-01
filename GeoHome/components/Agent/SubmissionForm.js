"use client"

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LocationPicker from './LocationPicker'
import PhotoUploader from './PhotoUploader'

const propertyTypes = ['Apartment', 'Bungalow', 'Maisonette', 'Townhouse', 'Studio', 'Bedsitter']
const waterOptions = ['Kiwasco', 'Borehole', 'Rainwater', 'Tank', 'None']
const electricityOptions = ['KPLC', 'Generator', 'Solar', 'None']
const parkingOptions = ['None', 'Street', 'Dedicated', 'Garage']
const securityOptions = ['Gated', 'Guard', 'CCTV', 'Alarm']
const backupOptions = ['None', 'Generator', 'Solar', 'Inverter']
const internetOptions = ['None', 'Fiber', 'Wireless', 'Mobile']

export default function SubmissionForm({ initialData = null, onSaved }) {
  const [form, setForm] = useState({
    property_type: '',
    rent: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    address: '',
    water_supply: [],
    electricity: [],
    parking: [],
    security: [],
    backup_power: [],
    internet: [],
    lat: -0.0917,
    lng: 34.7617,
    landlord_name: '',
    landlord_phone: '',
    notes: '',
    photos: [],
    photoFiles: [],
    video_urls: [''],
    status: 'pending_review'
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    if (!initialData) return
    setForm((prev) => ({
      ...prev,
      ...initialData,
      rent: initialData.rent ?? '',
      deposit: initialData.deposit ?? '',
      bedrooms: initialData.bedrooms ?? '',
      bathrooms: initialData.bathrooms ?? '',
      furnished: initialData.furnished ?? false,
      water_supply: initialData.water_supply ?? [],
      electricity: initialData.electricity ?? [],
      parking: initialData.parking ?? [],
      security: initialData.security ?? [],
      backup_power: initialData.backup_power ?? [],
      internet: initialData.internet ?? [],
      photos: initialData.photos ?? [],
      video_urls: initialData.video_urls ?? ['']
    }))
  }, [initialData])

  const canSubmit = useMemo(() => {
    return form.address && form.rent && form.landlord_name && form.landlord_phone
  }, [form])

  const validate = () => {
    const nextErrors = {}
    if (!form.property_type) nextErrors.property_type = 'Required'
    if (!form.rent) nextErrors.rent = 'Required'
    if (!form.address) nextErrors.address = 'Required'
    if (!form.landlord_name) nextErrors.landlord_name = 'Required'
    if (!form.landlord_phone) nextErrors.landlord_phone = 'Required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleOption = (field, value) => {
    setForm((prev) => {
      const current = prev[field] || []
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value]
      }
    })
  }

  const handlePhotoUpload = (files) => {
    setForm((prev) => ({ ...prev, photoFiles: files }))
  }

  const handlePhotoRemove = (index) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, index2) => index2 !== index)
    }))
  }

  const handleVideoUrlChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      video_urls: prev.video_urls.map((item, index2) => (index2 === index ? value : item))
    }))
  }

  const addVideoUrlField = () => {
    setForm((prev) => ({ ...prev, video_urls: [...prev.video_urls, ''] }))
  }

  const handleLocationChange = ([lng, lat]) => {
    setForm((prev) => ({ ...prev, lat, lng }))
  }

  const uploadPhotoFiles = async (agentId) => {
    const uploadedUrls = [...form.photos]
    for (const file of form.photoFiles || []) {
      const path = `agent-submissions/${agentId}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('agent-uploads').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('agent-uploads').getPublicUrl(path)
      if (data?.publicUrl) {
        uploadedUrls.push(data.publicUrl)
      }
    }
    return uploadedUrls
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    if (!validate()) return
    if (!canSubmit) return

    setSaving(true)
    setStatusMessage('Saving submission...')
    setErrors({})

    try {
      const values = {
        property_type: form.property_type,
        rent: Number(form.rent) || null,
        deposit: Number(form.deposit) || null,
        bedrooms: Number(form.bedrooms) || null,
        bathrooms: Number(form.bathrooms) || null,
        furnished: form.furnished,
        water_supply: form.water_supply,
        electricity: form.electricity,
        parking: form.parking,
        security: form.security,
        backup_power: form.backup_power,
        internet: form.internet,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        landlord_name: form.landlord_name,
        landlord_phone: form.landlord_phone,
        notes: form.notes,
        photos: form.photos,
        video_urls: form.video_urls.filter(Boolean),
        status: 'pending_review'
      }

      await onSaved(values, async (agentId) => {
        if (form.photoFiles?.length > 0) {
          return await uploadPhotoFiles(agentId)
        }
        return form.photos
      })
      setStatusMessage('Submission saved successfully.')
    } catch (err) {
      console.error(err)
      setStatusMessage('Unable to save submission.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-deep-maritime">Property details</h2>
            <p className="mt-2 text-sm text-anchor-gray">Enter the core rental listing information.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-deep-maritime">
              <span>Property type</span>
              <select
                value={form.property_type}
                onChange={(event) => handleChange('property_type', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              >
                <option value="">Select type</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.property_type && <div className="text-sm text-estate-red">{errors.property_type}</div>}
            </label>
            <label className="space-y-2 text-sm text-deep-maritime">
              <span>Rent (KES)</span>
              <input
                type="number"
                value={form.rent}
                onChange={(event) => handleChange('rent', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              />
              {errors.rent && <div className="text-sm text-estate-red">{errors.rent}</div>}
            </label>
            <label className="space-y-2 text-sm text-deep-maritime">
              <span>Deposit (KES)</span>
              <input
                type="number"
                value={form.deposit}
                onChange={(event) => handleChange('deposit', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              />
            </label>
            <label className="space-y-2 text-sm text-deep-maritime">
              <span>Bedrooms</span>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(event) => handleChange('bedrooms', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              />
            </label>
            <label className="space-y-2 text-sm text-deep-maritime">
              <span>Bathrooms</span>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(event) => handleChange('bathrooms', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-deep-maritime">
              <input
                type="checkbox"
                checked={form.furnished}
                onChange={(event) => handleChange('furnished', event.target.checked)}
              />
              Furnished
            </label>
            <label className="space-y-2 text-sm text-deep-maritime sm:col-span-2">
              <span>Address</span>
              <input
                type="text"
                value={form.address}
                onChange={(event) => handleChange('address', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
              />
              {errors.address && <div className="text-sm text-estate-red">{errors.address}</div>}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Water supply</p>
              <div className="mt-3 grid gap-2">
                {waterOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.water_supply.includes(option)}
                      onChange={() => toggleOption('water_supply', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Electricity</p>
              <div className="mt-3 grid gap-2">
                {electricityOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.electricity.includes(option)}
                      onChange={() => toggleOption('electricity', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Parking</p>
              <div className="mt-3 grid gap-2">
                {parkingOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.parking.includes(option)}
                      onChange={() => toggleOption('parking', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Security</p>
              <div className="mt-3 grid gap-2">
                {securityOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.security.includes(option)}
                      onChange={() => toggleOption('security', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Backup power</p>
              <div className="mt-3 grid gap-2">
                {backupOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.backup_power.includes(option)}
                      onChange={() => toggleOption('backup_power', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
              <p className="text-sm font-semibold text-deep-maritime">Internet</p>
              <div className="mt-3 grid gap-2">
                {internetOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-anchor-gray">
                    <input
                      type="checkbox"
                      checked={form.internet.includes(option)}
                      onChange={() => toggleOption('internet', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-deep-maritime">Landlord details</h2>
            <div className="mt-4 grid gap-4">
              <label className="space-y-2 text-sm text-deep-maritime">
                <span>Landlord name</span>
                <input
                  type="text"
                  value={form.landlord_name}
                  onChange={(event) => handleChange('landlord_name', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
                />
                {errors.landlord_name && <div className="text-sm text-estate-red">{errors.landlord_name}</div>}
              </label>
              <label className="space-y-2 text-sm text-deep-maritime">
                <span>Landlord phone</span>
                <input
                  type="tel"
                  value={form.landlord_phone}
                  onChange={(event) => handleChange('landlord_phone', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
                />
                {errors.landlord_phone && <div className="text-sm text-estate-red">{errors.landlord_phone}</div>}
              </label>
              <label className="space-y-2 text-sm text-deep-maritime">
                <span>Notes</span>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(event) => handleChange('notes', event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-cloud-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
                />
              </label>
            </div>
          </div>

          <LocationPicker value={[form.lng, form.lat]} onChange={handleLocationChange} />

          <div className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-deep-maritime">Media</h2>
            <PhotoUploader photos={form.photos} onUpload={handlePhotoUpload} onRemove={handlePhotoRemove} />
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-cloud-white p-4">
                <div className="text-sm font-semibold text-deep-maritime">Video URLs</div>
                <div className="mt-4 space-y-3">
                  {form.video_urls.map((url, index) => (
                    <input
                      key={index}
                      type="url"
                      value={url}
                      onChange={(event) => handleVideoUrlChange(index, event.target.value)}
                      placeholder="https://"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-official-teal"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addVideoUrlField}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-official-teal px-4 py-2 text-xs font-semibold text-official-teal hover:bg-official-teal/10"
                >
                  + Add another video link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && <div className="rounded-2xl border border-slate-200 bg-cloud-white px-6 py-4 text-sm text-deep-maritime">{statusMessage}</div>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center rounded-full bg-official-teal px-6 py-3 text-sm font-semibold text-white transition hover:bg-muted-teal disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Submit property for review'}
      </button>
    </form>
  )
}
