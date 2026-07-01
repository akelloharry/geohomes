"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabaseClient'
import { useAuth } from '../../../../context/AuthContext'
import PropertyForm from '../../../../components/PropertyForm'
import ProtectedRoute from '../../../../components/ProtectedRoute'

export default function EditPropertyPage({ params }) {
  const { id } = params
  const { user, loading } = useAuth()
  const [property, setProperty] = useState(null)
  const [units, setUnits] = useState([])
  const [loadingProperty, setLoadingProperty] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return
    fetchProperty()
  }, [loading, user])

  async function fetchProperty() {
    setLoadingProperty(true)
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single()
    if (error || !data) {
      console.error(error)
      setLoadingProperty(false)
      return
    }
    const { data: unitData } = await supabase.from('units').select('*').eq('property_id', id).order('name', { ascending: true })
    setProperty(data)
    setUnits(unitData || [])
    setLoadingProperty(false)
  }

  if (loading || loadingProperty) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (!property) {
    return <div className="p-6 text-center text-slate-700">Property not found.</div>
  }

  return (
    <ProtectedRoute allowedRoles={['landlord']}>
      <div className="px-4 py-6 lg:px-8">
        <PropertyForm propertyId={id} initialProperty={property} initialUnits={units} onSaved={() => router.push(`/properties/${id}`)} />
      </div>
    </ProtectedRoute>
  )
}
