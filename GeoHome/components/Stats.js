export default function Stats({ counties, activeListings, verifiedCount, loading }) {
  const percentActive = verifiedCount > 0 ? Math.round((activeListings / verifiedCount) * 100) : 0

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-pale-steel bg-cloud-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Counties</div>
        <div className="mt-4 text-4xl font-heading font-black text-deep-maritime">{loading ? '...' : counties}</div>
        <div className="mt-2 text-sm text-anchor-gray">Verified county coverage</div>
      </div>

      <div className="rounded-3xl border border-pale-steel bg-cloud-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Active listings</div>
        <div className="mt-4 text-4xl font-heading font-black text-official-teal">{loading ? '...' : activeListings}</div>
        <div className="mt-2 text-sm text-anchor-gray">Verified and available now</div>
      </div>

      <div className="rounded-3xl border border-pale-steel bg-cloud-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-xl">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Verified</div>
        <div className="mt-4 text-4xl font-heading font-black text-deep-maritime">{loading ? '...' : verifiedCount}</div>
        <div className="mt-2 text-sm text-anchor-gray">{loading ? 'Loading…' : `${percentActive}% active listings`}</div>
      </div>
    </div>
  )
}
