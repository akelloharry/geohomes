"use client"

import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'

function AdminInner() {
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [pendingProperties, setPendingProperties] = useState([])
  const [allProperties, setAllProperties] = useState([])

  useEffect(() => {
    fetchSubmissions()
    fetchUsers()
    fetchProperties()
  }, [])

  async function fetchSubmissions() {
    const res = await fetch('/api/admin/submissions')
    const data = await res.json()
    setSubmissions(data || [])
  }

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data || [])
  }

  async function fetchProperties() {
    const res = await fetch('/api/admin/properties')
    const data = await res.json()
    setAllProperties(data || [])
    setPendingProperties((data || []).filter((property) => property.verification_status === 'pending' || property.verification_status === 'pending_review'))
  }

  const reviewSubmission = async (id, action) => {
    await fetch('/api/admin/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: action === 'approve' ? 'approved' : 'rejected' })
    })
    fetchSubmissions()
    fetchProperties()
  }

  const updateUserRole = async (id, role) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role })
    })
    fetchUsers()
  }

  const updatePropertyStatus = async (id, status) => {
    await fetch('/api/admin/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    fetchProperties()
  }

  const updateUserVerified = async (id, verified) => {
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, verified })
    })
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-official-teal">GeoHome Admin</p>
            <h1 className="mt-2 text-3xl font-heading font-black text-deep-maritime">Admin Panel</h1>
          </div>
          <p className="max-w-2xl text-sm text-anchor-gray">Manage verifications, agent submissions, and user roles with a consistent corporate experience.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-deep-maritime">Pending property verifications</h2>
          <div className="mt-4 space-y-4">
            {pendingProperties.length ? pendingProperties.map((property) => (
              <div key={property.id} className="rounded-[24px] bg-cloud-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-deep-maritime">{property.title || 'Untitled'}</div>
                    <div className="text-sm text-anchor-gray">{property.address || 'No address'}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-full bg-official-teal px-3 py-1.5 text-sm font-semibold text-white" onClick={() => updatePropertyStatus(property.id, 'verified')}>Approve</button>
                    <button className="rounded-full bg-estate-red px-3 py-1.5 text-sm font-semibold text-white" onClick={() => updatePropertyStatus(property.id, 'rejected')}>Reject</button>
                  </div>
                </div>
              </div>
            )) : <div className="rounded-[24px] border border-dashed border-pale-steel p-6 text-sm text-anchor-gray">No pending properties.</div>}
          </div>
        </section>

        <section className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-deep-maritime">Agent submissions</h2>
          <div className="mt-4 space-y-4">
            {submissions.length ? submissions.map((submission) => (
              <div key={submission.id} className="rounded-[24px] bg-cloud-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-deep-maritime">{submission.property_type || 'Submission'} — KES {submission.rent || '—'}</div>
                    <div className="text-sm text-anchor-gray">Status: {submission.status}</div>
                  </div>
                  {submission.property_id && <div className="rounded-full bg-mint-hint px-3 py-1 text-xs font-semibold text-official-teal">Property {submission.property_id}</div>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-full bg-official-teal px-3 py-1.5 text-sm font-semibold text-white" onClick={() => reviewSubmission(submission.id, 'approve')}>Approve</button>
                  <button className="rounded-full bg-estate-red px-3 py-1.5 text-sm font-semibold text-white" onClick={() => reviewSubmission(submission.id, 'reject')}>Reject</button>
                </div>
              </div>
            )) : <div className="rounded-[24px] border border-dashed border-pale-steel p-6 text-sm text-anchor-gray">No pending agent submissions.</div>}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-deep-maritime">User management</h2>
        <div className="mt-4 space-y-4">
          {users.length ? users.map((user) => (
            <div key={user.id} className="rounded-[24px] bg-cloud-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-deep-maritime">{user.full_name || user.email || user.id}</div>
                  <div className="text-sm text-anchor-gray">Role: {user.role || 'tenant'} • Verified: {String(user.verified)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['tenant', 'landlord', 'agent', 'admin'].map((role) => (
                    <button key={role} className="rounded-full border border-pale-steel px-3 py-1 text-sm text-deep-maritime" onClick={() => updateUserRole(user.id, role)}>{role}</button>
                  ))}
                  <button className="rounded-full border border-pale-steel px-3 py-1 text-sm text-deep-maritime" onClick={() => updateUserVerified(user.id, !user.verified)}>{user.verified ? 'Unverify' : 'Verify'}</button>
                </div>
              </div>
            </div>
          )) : <div className="rounded-[24px] border border-dashed border-pale-steel p-6 text-sm text-anchor-gray">No users found.</div>}
        </div>
      </section>

      <section className="rounded-[28px] border border-pale-steel bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-deep-maritime">All properties</h2>
        <div className="mt-4 space-y-3">
          {allProperties.length ? allProperties.map((property) => (
            <div key={property.id} className="rounded-[24px] bg-cloud-white p-4">
              <div className="font-semibold text-deep-maritime">{property.title || 'Untitled property'}</div>
              <div className="text-sm text-anchor-gray">Verification: {property.verification_status || 'pending'} • Active: {property.available === false ? 'No' : 'Yes'}</div>
            </div>
          )) : <div className="rounded-[24px] border border-dashed border-pale-steel p-6 text-sm text-anchor-gray">No properties available.</div>}
        </div>
      </section>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminInner />
    </ProtectedRoute>
  )
}
