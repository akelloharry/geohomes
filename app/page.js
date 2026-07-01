"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Map from '../components/Map'
import { supabase } from '../lib/supabaseClient'

const KISUMU_CENTER = [34.7617, -0.12]
const overlayStyle = {
  background: 'linear-gradient(135deg, rgba(44, 110, 92, 0.55) 0%, rgba(44, 110, 92, 0.45) 30%, rgba(95, 138, 123, 0.35) 60%, rgba(30, 58, 77, 0.5) 100%)'
}

export default function HomePage() {
  const [properties, setProperties] = useState([])
  const [stats, setStats] = useState({ counties: 0, listings: 0, verified: 0, totalProperties: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const [propertiesResponse, countiesResponse, listingsResponse, verifiedResponse, totalResponse] = await Promise.all([
          supabase.rpc('properties_in_boundary', { boundary_name: 'kisumu' }),
          supabase.from('boundaries').select('*', { count: 'exact', head: true }).eq('category_name', 'county'),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified').eq('available', true),
          supabase.from('properties').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
          supabase.from('properties').select('*', { count: 'exact', head: true })
        ])

        if (!active) return

        if (propertiesResponse.error) {
          console.error(propertiesResponse.error)
        }

        const verifiedCount = verifiedResponse.count ?? 0
        const totalCount = totalResponse.count ?? 0
        const percentVerified = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0

        setProperties((propertiesResponse.data || []).filter((property) => property.available !== false))
        setStats({
          counties: countiesResponse.count ?? 0,
          listings: listingsResponse.count ?? 0,
          verified: percentVerified,
          totalProperties: totalCount
        })
      } catch (err) {
        console.error(err)
        if (active) {
          setError('Live listings are temporarily unavailable. Please try again shortly.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const statCards = useMemo(() => [
    { label: 'Counties', value: stats.counties.toLocaleString() },
    { label: 'Active Listings', value: stats.listings.toLocaleString() },
    { label: 'Verified', value: `${stats.verified}%` }
  ], [stats])

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/30 bg-deep-maritime shadow-[0_35px_90px_rgba(15,23,42,0.25)]">
      <div className="absolute inset-0 z-0">
        <Map center={KISUMU_CENTER} properties={properties} zoom={10} className="h-[78vh] min-h-[620px] w-full" />
        <div className="pointer-events-none absolute inset-0" style={overlayStyle} />
      </div>

      <div className="relative z-10 flex min-h-[78vh] flex-col justify-between px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl rounded-[28px] border border-white/25 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-cloud-white/90">
              <span className="mr-2 h-2.5 w-2.5 rounded-full bg-geohome-gold" />
              GeoHome Kenya
            </div>
            <h1 className="mt-4 font-heading text-3xl font-black leading-tight text-cloud-white sm:text-4xl lg:text-5xl">
              Find your home in Kenya <span className="text-geohome-gold">as simply as dropping a pin</span>
            </h1>
            <p className="mt-4 text-base leading-7 text-cloud-white/85 sm:text-lg">
              Explore verified rentals across Kisumu and beyond with a map-first experience designed for trust, speed, and local clarity.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/map"
                className="group inline-flex items-center justify-center rounded-full bg-cloud-white px-6 py-3 text-sm font-semibold text-official-teal transition duration-200 hover:scale-[1.02] hover:shadow-lg"
              >
                View More Listings
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#stats"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-cloud-white transition hover:bg-white/15"
              >
                See live stats
              </a>
            </div>
          </div>

          <div id="stats" className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px] lg:grid-cols-1">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-[24px] border border-white/20 bg-white/10 px-4 py-4 shadow-lg backdrop-blur-md sm:min-w-[140px] lg:min-w-[0]">
                <p className="text-3xl font-black text-geohome-gold">{loading ? '—' : card.value}</p>
                <p className="mt-1 text-sm font-medium text-cloud-white/80">{card.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/20 bg-deep-maritime/55 px-4 py-4 text-sm text-cloud-white/70 shadow-lg backdrop-blur-md sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 GeoHome Kenya</p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="transition hover:text-cloud-white">About</a>
              <a href="#" className="transition hover:text-cloud-white">Contact</a>
              <a href="#" className="transition hover:text-cloud-white">Privacy</a>
            </div>
          </div>
          {error ? <p className="mt-2 text-sm text-estate-red">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}
