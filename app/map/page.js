"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Map from "../../components/Map"
import { supabase } from "../../lib/supabaseClient"

const KISUMU_CENTER = [34.7617, -0.12]

export default function MapPage() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadProperties = async () => {
      setLoading(true)
      setError("")

      try {
        const { data, error: rpcError } = await supabase.rpc("properties_in_boundary", {
          boundary_name: "kisumu",
        })

        if (!active) return

        if (rpcError) {
          console.error("Properties RPC error:", rpcError)
          setError("Failed to load properties. Please try again.")
          return
        }

        setProperties((data || []).filter((property) => property.available !== false))
      } catch (err) {
        console.error("Map page error:", err)
        if (active) {
          setError("Connection error. Please check your network.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProperties()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden bg-cloud-white">
      {/* Back Button */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-official-teal shadow-lg transition hover:bg-cloud-white hover:shadow-xl"
      >
        ← Back to Home
      </Link>

      {/* Full-Screen Map */}
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-cloud-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-official-teal border-t-transparent"></div>
            <p className="text-sm text-anchor-gray">Loading properties...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-screen items-center justify-center bg-cloud-white">
          <div className="rounded-[24px] border border-pale-steel bg-white p-6 shadow-sm max-w-md">
            <p className="text-sm text-estate-red font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex rounded-full bg-official-teal px-6 py-2 text-sm font-semibold text-white transition hover:bg-deep-maritime"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <Map center={KISUMU_CENTER} properties={properties} zoom={10} className="h-screen w-full" />
      )}

      {/* Map Controls Info */}
      <div className="fixed bottom-4 left-4 z-40 rounded-[16px] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold text-deep-maritime">
          {properties.length} properties found
        </p>
        <p className="mt-1 text-xs text-anchor-gray">
          Click markers to view details
        </p>
      </div>
    </div>
  )
}
