"use client"

import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'

const propertyTypeOptions = ['Bedsitter', 'Single room', '1BR', '2BR', '3BR', 'Studio', 'Maisonette', 'Townhouse', 'Bungalow', 'Hostel room', 'BnB unit']
const defaultBedrooms = {
  Bedsitter: 0,
  'Single room': 1,
  '1BR': 1,
  '2BR': 2,
  '3BR': 3,
  Studio: 0,
  Maisonette: 3,
  Townhouse: 3,
  Bungalow: 3,
  'Hostel room': 1,
  'BnB unit': 1
}
const defaultBathrooms = {
  Bedsitter: 1,
  'Single room': 1,
  '1BR': 1,
  '2BR': 1,
  '3BR': 2,
  Studio: 1,
  Maisonette: 2,
  Townhouse: 2,
  Bungalow: 2,
  'Hostel room': 1,
  'BnB unit': 1
}

const blankUnit = {
  id: null,
  name: '',
  property_type: 'Bedsitter',
  bedrooms: 0,
  bathrooms: 1,
  rent_price: '',
  deposit: '',
  is_vacant: true,
  available_from: '',
  photos: [],
  video_url: '',
  photoFiles: [],
  videoFile: null
}

const blankTemplate = {
  id: `template-${Date.now()}`,
  property_type: 'Bedsitter',
  bedrooms: 0,
  bathrooms: 1,
  rent_price: '',
  deposit: '',
  quantity: 1,
  prefix: ''
}

function buildTemplateName(prefix, index) {
  return `${prefix || 'Unit'}-${String(index + 1).padStart(2, '0')}`
}

export default function UnitManager({ units, setUnits, onDeleteUnit }) {
  const [unitMode, setUnitMode] = useState('single')
  const [templates, setTemplates] = useState([])
  const [editingUnit, setEditingUnit] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDate, setBulkDate] = useState('')

  useEffect(() => {
    if (units.length > 1) {
      setUnitMode('multi')
    } else {
      setUnitMode('single')
    }
  }, [units.length])

  useEffect(() => {
    if (unitMode === 'single' && units.length === 0) {
      setUnits([{ ...blankUnit, id: `temp-${Date.now()}` }])
    }
  }, [unitMode, units.length, setUnits])

  const addTemplate = () => {
    setTemplates((current) => [...current, { ...blankTemplate, id: `template-${Date.now()}-${current.length}` }])
  }

  const updateTemplate = (index, changes) => {
    setTemplates((current) => current.map((template, idx) => (idx === index ? { ...template, ...changes } : template)))
  }

  const removeTemplate = (index) => {
    setTemplates((current) => current.filter((_, idx) => idx !== index))
  }

  const generateUnits = () => {
    const generated = templates.flatMap((template) => {
      const quantity = Number(template.quantity) || 1
      const prefix = template.prefix.trim() || 'Unit'
      return Array.from({ length: quantity }, (_, idx) => ({
        ...blankUnit,
        id: `gen-${template.id}-${idx}-${Date.now()}`,
        name: buildTemplateName(prefix, idx),
        property_type: template.property_type,
        bedrooms: Number(template.bedrooms) || 0,
        bathrooms: Number(template.bathrooms) || 1,
        rent_price: template.rent_price,
        deposit: template.deposit,
        is_vacant: true,
        available_from: '',
        photos: [],
        video_url: '',
        photoFiles: [],
        videoFile: null
      }))
    })
    if (generated.length === 0) return
    setUnits((current) => [...current, ...generated])
    setTemplates([])
  }

  const addSingleUnit = () => {
    setEditingUnit({ ...blankUnit, id: `temp-${Date.now()}` })
  }

  const canSaveUnit = editingUnit?.name && editingUnit?.rent_price

  const saveUnit = () => {
    if (!canSaveUnit) return
    setUnits((current) => {
      const next = current.filter((unit) => unit.id !== editingUnit.id)
      return [...next, { ...editingUnit, id: editingUnit.id || `temp-${Date.now()}` }]
    })
    setEditingUnit(null)
  }

  const deleteUnit = (unitId) => {
    setUnits((current) => current.filter((unit) => unit.id !== unitId))
    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(unitId)
      return next
    })
    if (onDeleteUnit) onDeleteUnit(unitId)
  }

  const toggleSelection = (unitId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }

  const bulkUpdateVacancy = (isVacant) => {
    setUnits((current) => current.map((unit) => selectedIds.has(unit.id) ? { ...unit, is_vacant: isVacant } : unit))
  }

  const bulkSetAvailableFrom = () => {
    if (!bulkDate) return
    setUnits((current) => current.map((unit) => selectedIds.has(unit.id) ? { ...unit, available_from: bulkDate } : unit))
  }

  const bulkDelete = () => {
    const idsToDelete = Array.from(selectedIds)
    setUnits((current) => current.filter((unit) => !selectedIds.has(unit.id)))
    idsToDelete.forEach((id) => onDeleteUnit && onDeleteUnit(id))
    setSelectedIds(new Set())
  }

  const handleEditType = (value) => {
    setEditingUnit((u) => ({
      ...u,
      property_type: value,
      bedrooms: defaultBedrooms[value],
      bathrooms: defaultBathrooms[value]
    }))
  }

  const sortedUnits = useMemo(() => [...units].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [units])

  return (
    <section className="space-y-6 rounded-3xl border bg-white p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Units management</h2>
          <p className="text-sm text-anchorGray">Define single-unit or multi-unit properties with templates and generated units.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-slate-50 p-2">
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${unitMode === 'single' ? 'bg-teal text-white' : 'text-slate-600'}`} onClick={() => setUnitMode('single')}>Single unit</button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm ${unitMode === 'multi' ? 'bg-teal text-white' : 'text-slate-600'}`} onClick={() => setUnitMode('multi')}>Multi-unit</button>
        </div>
      </div>

      {unitMode === 'single' ? (
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Single unit details</h3>
              <p className="text-sm text-anchorGray">This property will be saved with one unit.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="text" value={sortedUnits[0]?.name || ''} onChange={(e) => setUnits([{ ...sortedUnits[0], name: e.target.value, id: sortedUnits[0]?.id || `temp-${Date.now()}` }])} placeholder="Unit number / name" className="w-full border rounded-3xl px-4 py-3" />
            <select value={sortedUnits[0]?.property_type || 'Bedsitter'} onChange={(e) => {
              const type = e.target.value
              const unit = sortedUnits[0] || { ...blankUnit, id: `temp-${Date.now()}` }
              const updated = { ...unit, property_type: type, bedrooms: defaultBedrooms[type], bathrooms: defaultBathrooms[type] }
              setUnits([updated])
            }} className="w-full border rounded-3xl px-4 py-3">
              {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="number" min="0" value={sortedUnits[0]?.bedrooms ?? 0} onChange={(e) => setUnits([{ ...sortedUnits[0], bedrooms: Number(e.target.value) }])} placeholder="Bedrooms" className="w-full border rounded-3xl px-4 py-3" />
            <input type="number" min="0" value={sortedUnits[0]?.bathrooms ?? 1} onChange={(e) => setUnits([{ ...sortedUnits[0], bathrooms: Number(e.target.value) }])} placeholder="Bathrooms" className="w-full border rounded-3xl px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input type="number" min="0" value={sortedUnits[0]?.rent_price || ''} onChange={(e) => setUnits([{ ...sortedUnits[0], rent_price: e.target.value }])} placeholder="Rent price" className="w-full border rounded-3xl px-4 py-3" />
            <input type="number" min="0" value={sortedUnits[0]?.deposit || ''} onChange={(e) => setUnits([{ ...sortedUnits[0], deposit: e.target.value }])} placeholder="Deposit amount" className="w-full border rounded-3xl px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="inline-flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm">
              <input type="checkbox" checked={sortedUnits[0]?.is_vacant ?? true} onChange={(e) => setUnits([{ ...sortedUnits[0], is_vacant: e.target.checked }])} /> Vacant
            </label>
            <input type="date" value={sortedUnits[0]?.available_from || ''} onChange={(e) => setUnits([{ ...sortedUnits[0], available_from: e.target.value }])} className="w-full border rounded-3xl px-4 py-3" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Unit photos (max 5)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setUnits([{ ...sortedUnits[0], photoFiles: Array.from(e.target.files || []), id: sortedUnits[0]?.id || `temp-${Date.now()}` }])} className="mt-2 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium">Unit video (max 1)</label>
              <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => setUnits([{ ...sortedUnits[0], videoFile: e.target.files?.[0] || null, id: sortedUnits[0]?.id || `temp-${Date.now()}` }])} className="mt-2 w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Unit types (bulk add)</h3>
                <p className="text-sm text-anchorGray">Define templates for similar units, then generate concrete units.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full bg-teal px-4 py-2 text-sm text-white" onClick={addTemplate}>Add unit type</button>
                <button type="button" className="rounded-full border border-teal px-4 py-2 text-sm text-teal" onClick={generateUnits} disabled={templates.length === 0}>Generate units</button>
              </div>
            </div>
            {templates.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-anchorGray">No templates yet. Add a unit type to build templates.</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[760px] space-y-4">
                  {templates.map((template, index) => (
                    <div key={template.id} className="grid gap-3 md:grid-cols-[1.5fr_0.9fr_0.9fr_1fr_1fr_1fr] items-center rounded-3xl border p-4 bg-white">
                      <select value={template.property_type} onChange={(e) => updateTemplate(index, { property_type: e.target.value, bedrooms: defaultBedrooms[e.target.value], bathrooms: defaultBathrooms[e.target.value] })} className="w-full rounded-3xl border px-4 py-3">
                        {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <input type="number" min="0" value={template.bedrooms} onChange={(e) => updateTemplate(index, { bedrooms: Number(e.target.value) })} className="w-full rounded-3xl border px-4 py-3" placeholder="Bedrooms" />
                      <input type="number" min="0" value={template.bathrooms} onChange={(e) => updateTemplate(index, { bathrooms: Number(e.target.value) })} className="w-full rounded-3xl border px-4 py-3" placeholder="Bathrooms" />
                      <input type="number" min="0" value={template.rent_price} onChange={(e) => updateTemplate(index, { rent_price: e.target.value })} className="w-full rounded-3xl border px-4 py-3" placeholder="Rent" />
                      <input type="number" min="0" value={template.deposit} onChange={(e) => updateTemplate(index, { deposit: e.target.value })} className="w-full rounded-3xl border px-4 py-3" placeholder="Deposit" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input type="number" min="1" value={template.quantity} onChange={(e) => updateTemplate(index, { quantity: Number(e.target.value) })} className="w-full rounded-3xl border px-4 py-3" placeholder="Qty" />
                        <input type="text" value={template.prefix} onChange={(e) => updateTemplate(index, { prefix: e.target.value })} className="w-full rounded-3xl border px-4 py-3" placeholder="Prefix" />
                      </div>
                      <button type="button" className="rounded-full border border-estateRed px-4 py-3 text-sm text-estateRed" onClick={() => removeTemplate(index)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Individual units</h3>
                <p className="text-sm text-anchorGray">Edit generated units, add exceptions, and manage availability.</p>
              </div>
              <button type="button" className="rounded-full bg-teal px-4 py-2 text-sm text-white" onClick={addSingleUnit}>Add single unit</button>
            </div>

            {selectedIds.size > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <button type="button" className="rounded-full bg-mintHint px-4 py-2 text-sm text-teal" onClick={() => bulkUpdateVacancy(true)}>Mark vacant</button>
                <button type="button" className="rounded-full bg-estateRed/10 px-4 py-2 text-sm text-estateRed" onClick={() => bulkUpdateVacancy(false)}>Mark occupied</button>
                <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3">
                  <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
                  <button type="button" className="rounded-full bg-teal px-4 py-2 text-sm text-white" onClick={bulkSetAvailableFrom}>Apply</button>
                </div>
                <button type="button" className="rounded-full border border-estateRed px-4 py-2 text-sm text-estateRed" onClick={bulkDelete}>Delete selected</button>
              </div>
            )}

            {sortedUnits.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-anchorGray">No units have been generated yet. Use templates or add a single unit.</div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-700">
                      <th className="px-4 py-3"> </th>
                      <th className="px-4 py-3">Unit #</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Vacant</th>
                      <th className="px-4 py-3">Rent</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedUnits.map((unit) => (
                      <tr key={unit.id} className="bg-white">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.has(unit.id)} onChange={() => toggleSelection(unit.id)} className="h-4 w-4 rounded border-slate-300" />
                        </td>
                        <td className="px-4 py-3">{unit.name || 'Unit'}</td>
                        <td className="px-4 py-3">{unit.property_type}</td>
                        <td className="px-4 py-3">{unit.is_vacant ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3">KES {unit.rent_price || '—'}</td>
                        <td className="px-4 py-3">{unit.available_from || '—'}</td>
                        <td className="px-4 py-3 flex flex-wrap gap-2">
                          <button type="button" className="rounded-full border border-teal px-3 py-1 text-sm text-teal" onClick={() => setEditingUnit(unit)}>Edit</button>
                          <button type="button" className="rounded-full border border-estateRed px-3 py-1 text-sm text-estateRed" onClick={() => deleteUnit(unit.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={!!editingUnit} onClose={() => setEditingUnit(null)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">{editingUnit?.id ? 'Edit unit' : 'Add unit'}</h3>
              <p className="text-sm text-anchorGray">Unit details and pricing.</p>
            </div>
            <button className="text-sm text-anchorGray hover:text-teal" onClick={() => setEditingUnit(null)}>Close</button>
          </div>
          <div className="grid gap-4">
            <input type="text" required value={editingUnit?.name || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, name: e.target.value }))} placeholder="Unit number / name" className="w-full border rounded-lg px-4 py-3" />
            <select value={editingUnit?.property_type || 'Bedsitter'} onChange={(e) => handleEditType(e.target.value)} className="w-full border rounded-lg px-4 py-3">
              {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" min="0" value={editingUnit?.bedrooms ?? 0} onChange={(e) => setEditingUnit((u) => ({ ...u, bedrooms: Number(e.target.value) }))} placeholder="Bedrooms" className="w-full border rounded-lg px-4 py-3" />
              <input type="number" min="0" value={editingUnit?.bathrooms ?? 1} onChange={(e) => setEditingUnit((u) => ({ ...u, bathrooms: Number(e.target.value) }))} placeholder="Bathrooms" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="number" required min="0" value={editingUnit?.rent_price || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, rent_price: e.target.value }))} placeholder="Rent price" className="w-full border rounded-lg px-4 py-3" />
              <input type="number" min="0" value={editingUnit?.deposit || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, deposit: e.target.value }))} placeholder="Deposit amount" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <input type="checkbox" checked={editingUnit?.is_vacant ?? true} onChange={(e) => setEditingUnit((u) => ({ ...u, is_vacant: e.target.checked }))} /> Vacancy open
              </label>
              <input type="date" value={editingUnit?.available_from || ''} onChange={(e) => setEditingUnit((u) => ({ ...u, available_from: e.target.value }))} className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Unit photos (max 5)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setEditingUnit((u) => ({ ...u, photoFiles: Array.from(e.target.files || []) }))} className="w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Unit video (max 1)</label>
              <input type="file" accept="video/mp4,video/quicktime" onChange={(e) => setEditingUnit((u) => ({ ...u, videoFile: e.target.files?.[0] || null }))} className="w-full" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="rounded-full border px-4 py-2 text-sm text-anchorGray" onClick={() => setEditingUnit(null)}>Cancel</button>
              <button type="button" onClick={saveUnit} disabled={!canSaveUnit} className="rounded-full bg-teal px-4 py-2 text-sm text-white disabled:opacity-50">Save unit</button>
            </div>
            {!canSaveUnit && (
              <p className="text-sm text-anchorGray">Unit name and rent price are required before saving.</p>
            )}
          </div>
        </div>
      </Modal>
    </section>
  )
}
