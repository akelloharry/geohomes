"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import { LineChart, BarChart } from '../../components/AnalyticsChart'
import { supabase } from '../../lib/supabaseClient'
import UnitsModal from '../../components/UnitsModal'

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['landlord']}>
      <Dashboard />
    </ProtectedRoute>
  )
}

function Dashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [transactions, setTransactions] = useState([])
  const [propertyViews, setPropertyViews] = useState([])
  const [inquiryStats, setInquiryStats] = useState([])
  const [unitsOpenFor, setUnitsOpenFor] = useState(null)
  const [unitStats, setUnitStats] = useState({})

  useEffect(() => {
    if (loading) return
    if (!user) return
    const role = profile?.role || user.user_metadata?.role || 'tenant'
    if (role === 'tenant') return router.push('/')
    if (role === 'agent') return router.push('/agent')
    if (role === 'admin') return router.push('/admin')
    fetchProperties()
    fetchInquiries()
    fetchTransactions()
  }, [user, profile, loading])

  async function fetchProperties() {
    if (!user) return
    const { data } = await supabase.from('properties').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
    const items = data || []
    setProperties(items)
    fetchAnalytics(items)
    try {
      await fetchUnitStats(items)
    } catch (err) {
      console.error('fetchUnitStats failed:', err)
    }
  }

  async function fetchUnitStats(propertyList) {
    const propertyIds = propertyList.map((item) => item.id).filter(Boolean)
    if (!propertyIds.length) {
      setUnitStats({})
      return
    }
    let { data, error } = await supabase.from('units').select('property_id, is_vacant, rent_price').in('property_id', propertyIds)
    if (error) {
      console.error(error)
      if (error.code === '42703' || String(error.message || '').includes('rent_price')) {
        const fallback = await supabase.from('units').select('property_id, is_vacant').in('property_id', propertyIds)
        if (!fallback.error) {
          data = fallback.data
          error = null
        }
      }
    }
    if (error) {
      setUnitStats({})
      return
    }
    const stats = {}
    ;(data || []).forEach((unit) => {
      const propertyId = unit.property_id
      if (!stats[propertyId]) stats[propertyId] = { total: 0, vacant: 0, minRent: null }
      stats[propertyId].total += 1
      if (unit.is_vacant) stats[propertyId].vacant += 1
      const rent = Number(unit.rent_price)
      if (!Number.isNaN(rent)) {
        if (stats[propertyId].minRent === null) stats[propertyId].minRent = rent
        else stats[propertyId].minRent = Math.min(stats[propertyId].minRent, rent)
      }
    })
    setUnitStats(stats)
  }

  async function fetchAnalytics(propertyList) {
    if (!propertyList?.length) {
      setPropertyViews([])
      setInquiryStats([])
      return
    }
    const propertyIds = propertyList.map((item) => item.id).filter(Boolean)

    const { data: viewData, error: viewError } = await supabase.from('property_views').select('property_id, viewed_at').in('property_id', propertyIds).order('viewed_at', { ascending: true })
    if (!viewError && viewData) {
      const now = new Date()
      const days = Array.from({ length: 30 }, (_, index) => {
        const date = new Date(now)
        date.setDate(now.getDate() - (29 - index))
        return date.toISOString().slice(0, 10)
      })
      const viewStats = days.map((dateKey) => ({
        label: dateKey.slice(5),
        value: viewData.filter((item) => new Date(item.viewed_at).toISOString().slice(0, 10) === dateKey).length
      }))
      setPropertyViews(viewStats)
    } else {
      setPropertyViews([])
    }

    const { data: threadData, error: threadError } = await supabase.from('chat_threads').select('property_id, chat_messages(id)').in('property_id', propertyIds)
    if (!threadError && threadData) {
      const stats = propertyList.map((property) => {
        const count = threadData.reduce((sum, thread) => {
          if (thread.property_id !== property.id) return sum
          return sum + (thread.chat_messages?.length || 0)
        }, 0)
        return { label: property.title || property.address || `Property ${property.id}`, value: count }
      })
      setInquiryStats(stats)
    } else {
      const { data: inquiryData, error: inquiryError } = await supabase.from('inquiries').select('property_id').in('property_id', propertyIds)
      if (!inquiryError && inquiryData) {
        const stats = propertyList.map((property) => ({
          label: property.title || property.address || `Property ${property.id}`,
          value: inquiryData.filter((item) => item.property_id === property.id).length
        }))
        setInquiryStats(stats)
      } else {
        setInquiryStats([])
      }
    }
  }

  async function fetchInquiries() {
    if (!user) return
    try {
      const { data } = await supabase.from('inquiries').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
      setInquiries(data || [])
    } catch {
      setInquiries([])
    }
  }

  async function fetchTransactions() {
    if (!user) return
    try {
      const { data } = await supabase.from('transactions').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
      setTransactions(data || [])
    } catch {
      setTransactions([])
    }
  }

  const toggleActive = async (property) => {
    await supabase.from('properties').update({ available: !property.available }).eq('id', property.id)
    fetchProperties()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Landlord Dashboard</h1>
          <p className="text-sm text-anchorGray mt-1">Manage your listings, inquiries, and escrow transactions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-teal px-4 py-2 text-white" onClick={() => router.push('/properties/new')}>Add Property</button>
          <button className="rounded-full border border-teal px-4 py-2 text-teal" onClick={() => router.push('/properties/new')}>Add via full form</button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold text-lg">My Properties</h2>
            <div className="mt-4 space-y-4">
              {properties.length ? properties.map((property) => (
                <div key={property.id} className="rounded-3xl border p-4 bg-cloud">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <div className="font-semibold text-xl">{property.title || 'Untitled property'}</div>
                      <div className="text-sm text-anchorGray">{property.address || 'No address'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-1 ${property.verification_status === 'verified' ? 'bg-mintHint text-teal' : property.verification_status === 'rejected' ? 'bg-estateRed/10 text-estateRed' : 'bg-slate-100 text-slate-700'}`}>{property.verification_status || 'pending'}</span>
                      <span className={`rounded-full px-2 py-1 ${property.available === false ? 'bg-estateRed/10 text-estateRed' : 'bg-mintHint text-teal'}`}>{property.available === false ? 'Inactive' : 'Active'}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm text-anchorGray">
                    <div>Rent: KES {property.price || '—'}</div>
                    <div>Deposit: KES {property.deposit || '—'}</div>
                    <div>{property.bedrooms || '—'} bd • {property.bathrooms || '—'} ba</div>
                    <div>{unitStats[property.id]?.total || 0} units • {unitStats[property.id]?.vacant || 0} vacant</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-full border border-teal px-3 py-1 text-sm text-teal" onClick={() => router.push(`/properties/${property.id}/edit`)}>Edit</button>
                    <button className="rounded-full border border-estateRed px-3 py-1 text-sm text-estateRed" onClick={() => toggleActive(property)}>{property.available === false ? 'Reactivate' : 'Deactivate'}</button>
                    <button className="rounded-full bg-white border px-3 py-1 text-sm text-anchorGray" onClick={() => router.push(`/properties/${property.id}`)}>View</button>
                    <button className="rounded-full bg-white border px-3 py-1 text-sm text-anchorGray" onClick={() => setUnitsOpenFor(property.id)}>View units</button>
                  </div>
                </div>
              )) : <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-anchorGray">No properties yet. Add a property to start managing your listings.</div>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold">Inquiries</h2>
              <div className="mt-4 space-y-3">
                {inquiries.length ? inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-3xl bg-cloud p-3">
                    <div className="text-sm font-medium">Property ID: {inquiry.property_id}</div>
                    <p className="text-sm text-anchorGray mt-1">{inquiry.message}</p>
                    <div className="text-xs text-slate-500 mt-2">{new Date(inquiry.created_at).toLocaleString()}</div>
                  </div>
                )) : <div className="text-sm text-anchorGray">No inquiries yet.</div>}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold">Transactions</h2>
              <div className="mt-4 space-y-3">
                {transactions.length ? transactions.map((tx) => (
                  <div key={tx.id} className="rounded-3xl bg-cloud p-3">
                    <div className="text-sm font-medium">KES {tx.amount}</div>
                    <div className="text-sm text-anchorGray">{tx.status} — release on {tx.release_date ? new Date(tx.release_date).toLocaleDateString() : 'TBA'}</div>
                  </div>
                )) : <div className="text-sm text-anchorGray">No transactions yet.</div>}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-semibold">Quick tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-anchorGray list-disc list-inside">
              <li>New properties are submitted as pending until admin verification.</li>
              <li>Edit any field except property ownership after creation.</li>
              <li>Deactivate a property to remove it from tenant search.</li>
            </ul>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-sm font-semibold">Key metrics</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-anchorGray">Active listings</div>
                <div className="mt-2 text-2xl font-semibold">{properties.length}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-anchorGray">Total views</div>
                <div className="mt-2 text-2xl font-semibold">{propertyViews.reduce((sum, item) => sum + item.value, 0)}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-anchorGray">Total inquiries</div>
                <div className="mt-2 text-2xl font-semibold">{inquiryStats.reduce((sum, item) => sum + item.value, 0)}</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-anchorGray">Conversion rate</div>
                <div className="mt-2 text-2xl font-semibold">
                  {(() => {
                    const views = propertyViews.reduce((sum, item) => sum + item.value, 0)
                    const inquiries = inquiryStats.reduce((sum, item) => sum + item.value, 0)
                    return views ? `${((inquiries / views) * 100).toFixed(0)}%` : '0%'
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <LineChart data={propertyViews} />
          </div>
          <div className="bg-white border rounded-xl p-4">
            <BarChart data={inquiryStats} />
          </div>
        </aside>
      </section>
      <UnitsModal propertyId={unitsOpenFor} open={!!unitsOpenFor} onClose={() => setUnitsOpenFor(null)} />
    </div>
  )
}
