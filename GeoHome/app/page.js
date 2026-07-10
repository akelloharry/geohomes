'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Map from '../components/Map'
import Stats from '../components/Stats'

const kisumuCenter = [34.7617, -0.0917]
const localFallbackProperties = [
  {
    id: 'fallback-1',
    title: 'Riverside Apartments',
    address: 'Along Kisumu River',
    price: 15000,
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Rental',
    lat: -0.0905,
    lng: 34.7610,
    available: true,
    verification_status: 'verified'
  },
  {
    id: 'fallback-2',
    title: 'Campus View Hostel',
    address: 'Near University',
    price: 8000,
    bedrooms: 6,
    bathrooms: 2,
    property_type: 'Hostel',
    lat: -0.0950,
    lng: 34.7625,
    available: true,
    verification_status: 'verified'
  },
  {
    id: 'fallback-3',
    title: 'Cozy BnB',
    address: 'Central Kisumu',
    price: 5000,
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'BnB',
    lat: -0.0919,
    lng: 34.7630,
    available: true,
    verification_status: 'verified'
  }
]

const overlayStyles = 'pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,111,223,0.42),transparent_34%),linear-gradient(135deg,rgba(30,111,223,0.65)_0%,rgba(245,158,11,0.50)_100%)]'

export default function HomePage() {
  const { loading } = useAuth()
  const [properties, setProperties] = useState([])
  const [stats, setStats] = useState({ counties: 0, activeListings: 0, verifiedCount: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingProperties, setLoadingProperties] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true)
      const [{ count: counties }, { count: activeListings }, { count: verifiedCount }] = await Promise.all([
        supabase.from('boundaries').select('*', { count: 'exact', head: true }).eq('category_name', 'county'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified').eq('available', true),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')
      ])

      setStats({ counties: counties ?? 0, activeListings: activeListings ?? 0, verifiedCount: verifiedCount ?? 0 })
      setLoadingStats(false)
    }

    const fetchProperties = async () => {
      setLoadingProperties(true)
      let loaded = []

      const { data, error } = await supabase.rpc('properties_in_boundary', { boundary_name: 'kisumu' })
      if (!error && Array.isArray(data) && data.length > 0) {
        loaded = data
      }

      if (loaded.length === 0) {
        const { data: nearbyData, error: nearbyError } = await supabase.rpc('nearby_properties', {
          lat_param: kisumuCenter[1],
          lng_param: kisumuCenter[0],
          radius: 5000
        })

        if (!nearbyError && Array.isArray(nearbyData) && nearbyData.length > 0) {
          loaded = nearbyData
        }
      }

      if (loaded.length === 0) {
        loaded = localFallbackProperties
      }

      setProperties(loaded)
      setLoadingProperties(false)
    }

    fetchStats()
    fetchProperties()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-deep-maritime">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-official-teal"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-deep-maritime text-white">
      <Map center={kisumuCenter} properties={properties} className="absolute inset-0 h-full w-full" />

      <div className={overlayStyles} />

      <div className="absolute inset-0 z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
        <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cloud-white/80">GeoHome Kenya</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-3xl font-heading font-black sm:text-4xl">
              <span>Geo</span>
              <span className="text-official-teal">Home</span>
              <span>Kenya</span>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-cloud-white/85">
            <Link href="#about" className="hover:text-white">About</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
            <Link href="#privacy" className="hover:text-white">Privacy</Link>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-10 text-left sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-official-teal/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-official-teal backdrop-blur-xl">
              GeoHome Verified rentals in Kisumu
            </span>
            <h1 className="mt-6 text-4xl font-heading font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Kisumu rentals, mapped for confident tenants.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-cloud-white/85 sm:text-lg">
              Explore verified and available homes in Kisumu with live map pins, city-wide rental stats, and an elegant full-screen experience built for tenants.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
            <div className="rounded-[32px] border border-cloud-white/15 bg-cloud-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-pale-steel/60 bg-cloud-white/80 p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">County coverage</div>
                  <div className="mt-4 text-4xl font-heading font-black text-cloud-white">{loadingStats ? '...' : stats.counties}</div>
                  <p className="mt-2 text-sm text-anchor-gray">Verified counties served</p>
                </div>
                <div className="rounded-3xl border border-pale-steel/60 bg-cloud-white/80 p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Active listings</div>
                  <div className="mt-4 text-4xl font-heading font-black text-official-teal">{loadingStats ? '...' : stats.activeListings}</div>
                  <p className="mt-2 text-sm text-anchor-gray">Verified homes currently available</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-pale-steel/60 bg-cloud-white/80 p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Latest properties</div>
                <div className="mt-5 space-y-4 text-sm text-anchor-gray">
                  {loadingProperties ? (
                    <div>Loading active listings…</div>
                  ) : properties.length === 0 ? (
                    <div>No active properties found in Kisumu.</div>
                  ) : (
                    properties.slice(0, 3).map((property) => (
                      <div key={property.id} className="rounded-3xl border border-pale-steel/60 bg-cloud-white/90 p-4">
                        <div className="font-semibold text-deep-maritime">{property.title || 'Verified rental'}</div>
                        <div className="mt-1 text-sm text-anchor-gray">{property.address || 'Kisumu, Kenya'}</div>
                        <div className="mt-2 text-sm text-anchor-gray">{property.property_type || 'Rental'} • KES {property.price ?? '—'}/month</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-anchor-gray">
                          <span>{property.bedrooms ?? '—'} bd</span>
                          <span>{property.bathrooms ?? '—'} ba</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-cloud-white/15 bg-cloud-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-cloud-white/75">Tenant-first tools</div>
                <h2 className="mt-4 text-3xl font-heading font-black text-cloud-white">Full-screen map, instant listings, trusted homes.</h2>
                <p className="mt-4 text-sm leading-7 text-cloud-white/75">
                  Browse Kisumu rentals with confidence. Our map highlights available verified homes and makes it easy to explore the best listings in the city.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <span className="inline-flex items-center gap-2 rounded-full bg-mint-hint/70 px-4 py-2 text-sm font-semibold text-trust-teal">Verified rent</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-geohome-gold/15 px-4 py-2 text-sm font-semibold text-geohome-gold">City-focused search</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-muted-teal/15 px-4 py-2 text-sm font-semibold text-muted-teal">Tenant-first design</span>
                </div>
              </div>

              <div className="rounded-[32px] border border-cloud-white/15 bg-cloud-white/10 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-cloud-white/75">Ready to explore</div>
                <p className="mt-4 text-sm text-cloud-white/75">Tap the map pins or follow the button below to see every Kisumu listing in a full-screen discovery experience.</p>
                <Link href="/map" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-official-teal px-5 py-4 text-base font-semibold text-white transition hover:bg-muted-teal">
                  View more listings
                  <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-cloud-white/15 pt-6 text-sm text-cloud-white/80 sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 GeoHome Kenya</div>
          <div className="flex flex-wrap gap-4">
            <Link href="#about" className="hover:text-white">About</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
            <Link href="#privacy" className="hover:text-white">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
