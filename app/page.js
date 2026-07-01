"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import NearbySearch from '../components/NearbySearch'
import { supabase } from '../lib/supabaseClient'

// Dynamic properties loaded from Supabase RPC
const defaultCenter = [34.7617, -0.0917]


const features = [
  {
    icon: '📍',
    title: 'Search by exact geopoint',
    description: 'Drop a pin on your office, campus, or any landmark. We show properties within your chosen walking distance.'
  },
  {
    icon: '✅',
    title: 'Field‑verified properties',
    description: 'Our agents visit and photograph every listed property. No fake listings, no scams.'
  },
  {
    icon: '🔒',
    title: 'Secure escrow payments',
    description: 'Your rent and deposit are held safely until you’ve moved in and confirmed everything is as agreed.'
  }
]

const steps = [
  {
    icon: '1️⃣',
    title: 'Drop a pin',
    description: 'On the map, anywhere you want to live near.'
  },
  {
    icon: '2️⃣',
    title: 'Set radius & filter',
    description: 'Choose distance, price, bedrooms, amenities.'
  },
  {
    icon: '3️⃣',
    title: 'Book & pay securely',
    description: 'Schedule viewing, pay deposit via M-Pesa escrow.'
  }
]

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [properties, setProperties] = useState([])
  const [loadingProperties, setLoadingProperties] = useState(false)

  useEffect(() => {
    // Load a default set of nearby verified properties for the homepage
    const fetchProperties = async () => {
      setLoadingProperties(true)
      try {
        const payload = { lat_param: defaultCenter[1], lng_param: defaultCenter[0], radius: 3000 }
        const { data, error } = await supabase.rpc('nearby_properties', payload)
        if (error) {
          console.error('nearby_properties RPC error:', error)
          setProperties([])
        } else {
          setProperties((data || []).filter((p) => p.verification_status === 'verified' && (p.available ?? true)))
        }
      } catch (err) {
        console.error(err)
        setProperties([])
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [])

  // Redirect non-tenant users to their role-specific dashboards
  useEffect(() => {
    if (loading) return
    if (!user) return
    const role = profile?.role ?? user?.user_metadata?.role ?? 'tenant'
    if (role === 'tenant') return // stay on home page
    if (role === 'landlord') return router.replace('/dashboard')
    if (role === 'agent') return router.replace('/agent')
    if (role === 'admin') return router.replace('/admin')
  }, [user, profile, loading, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal"></div>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-mintHint px-4 py-2 text-sm font-semibold text-teal">
            GeoHome Kenya
          </p>
          <h1 className="font-heading text-4xl font-black tracking-tight text-primary sm:text-5xl">
            Find your home <span className="text-teal">by exact location</span> not just an address.
          </h1>
          <p className="max-w-2xl text-base text-anchorGray sm:text-lg">
            Drop a pin anywhere – your workplace, a school, a matatu stage. See verified rentals within walking distance. No scams, no guesswork.
          </p>

          <div className="rounded-full bg-white p-5 shadow-lg ring-1 ring-black/5 sm:flex sm:items-center sm:gap-3">
            <input
              type="text"
              placeholder="Search by area, landmark, or drop a pin on the map..."
              className="w-full rounded-full border border-paleSteel px-5 py-3 text-sm text-midnight focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
            <button className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary sm:mt-0 sm:w-auto">
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-anchorGray">
            <span className="inline-flex rounded-full bg-mintHint px-3 py-1 text-xs font-semibold text-teal">✓ Field verified</span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">🔒 Secure payments</span>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">📍 Exact geopoint</span>
          </div>
        </div>

        <div className="rounded-[28px] bg-mintHint p-8 shadow-lg">
          <div className="flex h-full flex-col items-center justify-center gap-6 rounded-[24px] bg-white/80 p-6 backdrop-blur-sm">
            <div className="grid h-48 w-full place-items-center rounded-3xl bg-teal/10 text-6xl">📍</div>
            <p className="text-center text-sm text-anchorGray">
              Click anywhere on the map → see rentals within your radius.
            </p>
          </div>
        </div>
      </section>

      <NearbySearch />

      <section id="tenants" className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-[24px] bg-white p-6 shadow-lg">
            <div className="mb-4 text-3xl">{feature.icon}</div>
            <h3 className="mb-3 text-xl font-semibold text-primary">{feature.title}</h3>
            <p className="text-sm text-anchorGray">{feature.description}</p>
          </div>
        ))}
      </section>

      <section id="properties">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-3xl font-bold text-primary">Recently verified in Kisumu</h2>
          <a href="#properties" className="text-sm font-semibold text-teal hover:text-primary">View more</a>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {properties.map((property) => (
            <div key={property.title} className="rounded-[24px] bg-white p-6 shadow-lg transition hover:-translate-y-1">
              <div className="property-img">📸 Property image</div>
              <div className="mt-4 space-y-2">
                <div className="text-xl font-semibold text-teal">{property.title}</div>
                <div className="text-sm text-primary">{property.desc}</div>
                <div className="text-xs text-anchorGray">{property.meta}</div>
                <span className="inline-flex rounded-full bg-mintHint px-3 py-1 text-xs font-semibold text-teal">{property.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="space-y-6 text-center">
        <h2 className="font-heading text-3xl font-bold text-primary">How GeoHome works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-[24px] bg-white p-6 shadow-lg">
              <div className="mb-4 text-3xl">{step.icon}</div>
              <h3 className="mb-3 text-xl font-semibold text-primary">{step.title}</h3>
              <p className="text-sm text-anchorGray">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-primary px-8 py-12 text-center text-white">
        <h2 className="font-heading text-3xl font-bold">Ready to find your next home?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
          Join hundreds of tenants and landlords who trust GeoHome Kenya.
        </p>
        <Link href="/signup" className="mt-6 inline-flex rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-slate-100">
          Get started – it&apos;s free
        </Link>
      </section>

      <footer className="rounded-[24px] bg-white p-8 shadow-lg">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h4 className="font-heading text-base font-semibold text-primary">GeoHome Kenya</h4>
            <a href="#" className="block text-sm text-anchorGray mt-3 hover:text-teal">About us</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Contact</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Careers</a>
          </div>
          <div>
            <h4 className="font-heading text-base font-semibold text-primary">Tenants</h4>
            <a href="#" className="block text-sm text-anchorGray mt-3 hover:text-teal">How to search</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Buy a search pass</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Tenant protection</a>
          </div>
          <div id="landlords">
            <h4 className="font-heading text-base font-semibold text-primary">Landlords</h4>
            <a href="#" className="block text-sm text-anchorGray mt-3 hover:text-teal">List your property</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Verification process</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Pricing</a>
          </div>
          <div>
            <h4 className="font-heading text-base font-semibold text-primary">Legal</h4>
            <a href="#" className="block text-sm text-anchorGray mt-3 hover:text-teal">Terms of service</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Privacy policy</a>
            <a href="#" className="block text-sm text-anchorGray mt-2 hover:text-teal">Data Protection (ODPC)</a>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xs text-anchorGray">
          © 2026 GeoHome Kenya. All rights reserved. Built with trust for the Kenyan rental market.
        </div>
      </footer>
    </div>
  )
}
