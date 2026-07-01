"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Map from './Map'
import UnitManager from './UnitManager'

const waterOptions = ['Kiwasco', 'Borehole', 'Tank', 'None', 'Other']
const electricityOptions = ['Kenya Power', 'Generator', 'Solar', 'None']
const securityOptions = ['Gated', 'Guard', 'CCTV', 'Alarm']
const backupOptions = ['None', 'Generator', 'Solar', 'Inverter']
const internetOptions = ['None', 'Fiber', 'Wireless', 'Mobile']
const parkingOptions = ['None', 'Street', 'Dedicated', 'Garage']

const blankProperty = {
  title: '',
  address: '',
  lat: 34.7617,
  lng: -0.0917,
  water_supply: [],
  water_supply_other: '',
  electricity: [],
  security: [],
  backup_power: [],
  internet: [],
  parking: [],
  furnished: false,
  photos: [],
  photoFiles: [],
  videoUrls: [],
  videoFiles: []
}

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export default function PropertyForm({ propertyId = null, initialProperty = null, initialUnits = [], onSaved }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState(blankProperty)
  const [units, setUnits] = useState(initialUnits)
  const [deletedUnitIds, setDeletedUnitIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initialProperty) return
    setForm({
      title: initialProperty.title || '',
      address: initialProperty.address || '',
      lat: initialProperty.lat ?? initialProperty.latitude ?? 34.7617,
      lng: initialProperty.lng ?? initialProperty.longitude ?? -0.0917,
      water_supply: initialProperty.water_supply || [],
      water_supply_other: initialProperty.water_supply_other || '',
      electricity: initialProperty.electricity || [],
      security: initialProperty.security || [],
      backup_power: initialProperty.backup_power || [],
      internet: initialProperty.internet || [],
      parking: initialProperty.parking || [],
      furnished: initialProperty.furnished ?? false,
      photos: initialProperty.photos || [],
      photoFiles: [],
      videoUrls: initialProperty.video_urls || [],
      videoFiles: []
    })
  }, [initialProperty])

  useEffect(() => {
    if (!initialUnits) return
    setUnits(initialUnits.map((unit) => ({ ...unit, photoFiles: [], videoFile: null })))
  }, [initialUnits])

  const allWaterOptions = useMemo(() => waterOptions, [])
  const allElectricityOptions = useMemo(() => electricityOptions, [])

  const canSubmit = form.title && form.address && units.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (saving) return
    if (!user) return setError('Please sign in as a landlord first.')
    if (!canSubmit) return setError('Please fill in the required fields.')
    const invalidUnit = units.find((unit) => !unit.name || !unit.rent_price)
    if (invalidUnit) return setError('Every unit needs a name and rent price.')

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        address: form.address,
        lat: form.lat,
        lng: form.lng,
        water_supply: form.water_supply,
        water_supply_other: form.water_supply_other || null,
        electricity: form.electricity,
        security: form.security,
        backup_power: form.backup_power,
        internet: form.internet,
        parking: form.parking,
        furnished: form.furnished,
        landlord_id: user.id,
        verification_status: initialProperty ? initialProperty.verification_status || 'pending' : 'pending',
        available: true
      }

      let savedPropertyId = propertyId
      if (propertyId) {
        const { error: updateError } = await supabase.from('properties').update(payload).eq('id', propertyId)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase.from('properties').insert(payload).select('id').single()
        if (insertError || !data) throw insertError || new Error('Could not create property')
        savedPropertyId = data.id
      }

      const uploadedPhotoUrls = [...form.photos]
      for (const file of form.photoFiles.slice(0, 20 - (form.photos?.length || 0))) {
        const path = `${savedPropertyId}/${Date.now()}_${file.name}`
        const publicUrl = await uploadFile('property-photos', path, file)
        uploadedPhotoUrls.push(publicUrl)
      }
      const uploadedVideoUrls = [...form.videoUrls]
      for (const file of form.videoFiles.slice(0, 3 - (form.videoUrls?.length || 0))) {
        if (!['video/mp4', 'video/quicktime', 'video/quicktime', 'video/mov'].includes(file.type) && !file.name.toLowerCase().endsWith('.mov')) {
          continue
        }
        if (file.size > 50 * 1024 * 1024) continue
        const path = `${savedPropertyId}/videos/${Date.now()}_${file.name}`
        const publicUrl = await uploadFile('property-videos', path, file)
        uploadedVideoUrls.push(publicUrl)
      }

      await supabase.from('properties').update({ photos: uploadedPhotoUrls, video_urls: uploadedVideoUrls }).eq('id', savedPropertyId)

      // Handle units
      const existingUnitIds = new Set(initialUnits.map((unit) => unit.id))
      const newUnits = units.filter((unit) => !existingUnitIds.has(unit.id))
      const updatedUnits = units.filter((unit) => existingUnitIds.has(unit.id))

      for (const unitId of deletedUnitIds) {
        await supabase.from('units').delete().eq('id', unitId)
      }

      for (const unit of updatedUnits) {
        const unitPayload = {
          property_id: savedPropertyId,
          name: unit.name,
          property_type: unit.property_type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          rent_price: Number(unit.rent_price) || null,
          deposit: Number(unit.deposit) || null,
          is_vacant: unit.is_vacant,
          available_from: unit.available_from || null,
          photos: unit.photos || [],
          video_url: unit.video_url || null
        }
        const { error: unitError } = await supabase.from('units').update(unitPayload).eq('id', unit.id)
        if (unitError) throw unitError
        if (unit.photoFiles?.length > 0 || unit.videoFile) {
          const uploadedUnitPhotos = [...(unit.photos || [])]
          for (const file of unit.photoFiles.slice(0, 5 - uploadedUnitPhotos.length)) {
            const path = `${savedPropertyId}/units/${unit.id}/photos/${Date.now()}_${file.name}`
            const publicUrl = await uploadFile('property-photos', path, file)
            uploadedUnitPhotos.push(publicUrl)
          }
          let uploadedVideoUrl = unit.video_url || null
          if (unit.videoFile) {
            const path = `${savedPropertyId}/units/${unit.id}/video_${Date.now()}_${unit.videoFile.name}`
            uploadedVideoUrl = await uploadFile('property-videos', path, unit.videoFile)
          }
          await supabase.from('units').update({ photos: uploadedUnitPhotos, video_url: uploadedVideoUrl }).eq('id', unit.id)
        }
      }

      for (const unit of newUnits) {
        const { data: inserted, error: insertUnitError } = await supabase.from('units').insert({
          property_id: savedPropertyId,
          name: unit.name,
          property_type: unit.property_type,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          rent_price: Number(unit.rent_price) || null,
          deposit: Number(unit.deposit) || null,
          is_vacant: unit.is_vacant,
          available_from: unit.available_from || null,
          photos: [],
          video_url: null
        }).select('id').single()
        if (insertUnitError || !inserted) throw insertUnitError || new Error('Could not insert unit')
        const newUnitId = inserted.id
        const unitPhotos = []
        for (const file of (unit.photoFiles || []).slice(0, 5)) {
          const path = `${savedPropertyId}/units/${newUnitId}/photos/${Date.now()}_${file.name}`
          const publicUrl = await uploadFile('property-photos', path, file)
          unitPhotos.push(publicUrl)
        }
        let videoUrl = null
        if (unit.videoFile) {
          const path = `${savedPropertyId}/units/${newUnitId}/video_${Date.now()}_${unit.videoFile.name}`
          videoUrl = await uploadFile('property-videos', path, unit.videoFile)
        }
        await supabase.from('units').update({ photos: unitPhotos, video_url: videoUrl }).eq('id', newUnitId)
      }

      if (onSaved) {
        onSaved(savedPropertyId)
      } else {
        router.push(`/properties/${savedPropertyId}`)
      }
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUnit = (unitId) => {
    setUnits((current) => current.filter((unit) => unit.id !== unitId))
    if (unitId && !unitId.toString().startsWith('temp-') && !unitId.toString().startsWith('bulk-')) {
      setDeletedUnitIds((current) => [...current, unitId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold">{propertyId ? 'Edit property' : 'Create new property'}</h1>
            <p className="text-sm text-anchorGray">Add property details, upload media, and manage units for multi-unit buildings.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold">Tip</p>
            <p className="mt-2">Use the map pin or click the map to set latitude and longitude. Fill in all required sections before saving.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Basic information</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Property title"
                className="w-full border rounded-3xl px-4 py-3"
              />
              <input
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
                className="w-full border rounded-3xl px-4 py-3"
              />
            </div>
            <div className="mt-4 rounded-3xl overflow-hidden border">
              <Map
                center={[form.lng, form.lat]}
                pinLocation={[form.lng, form.lat]}
                draggable
                onPinMove={([lng, lat]) => setForm({ ...form, lng, lat })}
                onMarkerClick={([lng, lat]) => setForm({ ...form, lng, lat })}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                  className="mt-2 w-full border rounded-3xl px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
                  className="mt-2 w-full border rounded-3xl px-4 py-3"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Property details</h2>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Water supply</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {allWaterOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.water_supply.includes(option)}
                          onChange={() => setForm({ ...form, water_supply: toggleValue(form.water_supply, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {form.water_supply.includes('Other') && (
                    <input
                      value={form.water_supply_other}
                      onChange={(e) => setForm({ ...form, water_supply_other: e.target.value })}
                      placeholder="Other water source"
                      className="mt-3 w-full border rounded-3xl px-4 py-3"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Electricity</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {allElectricityOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.electricity.includes(option)}
                          onChange={() => setForm({ ...form, electricity: toggleValue(form.electricity, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Security</label>
                  <div className="mt-2 grid gap-2">
                    {securityOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.security.includes(option)}
                          onChange={() => setForm({ ...form, security: toggleValue(form.security, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Backup power</label>
                  <div className="mt-2 grid gap-2">
                    {backupOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.backup_power.includes(option)}
                          onChange={() => setForm({ ...form, backup_power: toggleValue(form.backup_power, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Internet</label>
                  <div className="mt-2 grid gap-2">
                    {internetOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.internet.includes(option)}
                          onChange={() => setForm({ ...form, internet: toggleValue(form.internet, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Parking</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {parkingOptions.map((option) => (
                      <label key={option} className="inline-flex items-center gap-2 rounded-3xl border px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          checked={form.parking.includes(option)}
                          onChange={() => setForm({ ...form, parking: toggleValue(form.parking, option) })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.furnished}
                    onChange={(e) => setForm({ ...form, furnished: e.target.checked })}
                  />
                  Furnished
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Property photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setForm({ ...form, photoFiles: Array.from(e.target.files || []) })}
                    className="mt-2 w-full text-sm"
                  />
                  <p className="mt-2 text-xs text-anchorGray">Up to 20 images.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Property videos</label>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime"
                    multiple
                    onChange={(e) => setForm({ ...form, videoFiles: Array.from(e.target.files || []) })}
                    className="mt-2 w-full text-sm"
                  />
                  <p className="mt-2 text-xs text-anchorGray">Up to 3 files, max 50MB each.</p>
                </div>
              </div>
            </div>
          </section>

          <UnitManager units={units} setUnits={setUnits} onDeleteUnit={handleDeleteUnit} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Property summary</h2>
            <div className="mt-4 space-y-3 text-sm text-anchorGray">
              <div>Water: {form.water_supply.join(', ') || 'Not set'}</div>
              {form.water_supply.includes('Other') && <div>Other water source: {form.water_supply_other || 'None'}</div>}
              <div>Electricity: {form.electricity.join(', ') || 'Not set'}</div>
              <div>Security: {form.security.join(', ') || 'None'}</div>
              <div>Backup power: {form.backup_power.join(', ') || 'None'}</div>
              <div>Internet: {form.internet.join(', ') || 'None'}</div>
              <div>Parking: {form.parking.join(', ') || 'None'}</div>
              <div>Units: {units.length}</div>
              <div>Video links: {form.videoUrls.length}</div>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6">
            <h2 className="text-xl font-semibold">Save</h2>
            {error && <p className="rounded-3xl bg-estateRed/10 p-3 text-sm text-estateRed">{error}</p>}
            <button
              className="w-full rounded-full bg-teal px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              onClick={handleSubmit}
              disabled={saving || !canSubmit}
            >
              {saving ? 'Saving...' : propertyId ? 'Save property' : 'Create property'}
            </button>
            {(!form.water_supply.length || !form.electricity.length) && (
              <p className="mt-3 text-sm text-anchorGray">Water and electricity are optional here; you can save the property now and update those details later.</p>
            )}
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-anchorGray"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
