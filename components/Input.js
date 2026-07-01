"use client"

export default function Input({ label, ...props }) {
  return (
    <label className="block text-sm text-anchor-gray">
      {label && <div className="mb-1 font-semibold text-deep-maritime">{label}</div>}
      <input className="w-full rounded-2xl border border-pale-steel bg-cloud-white px-3 py-2.5 text-sm text-deep-maritime focus:border-official-teal focus:outline-none focus:ring-2 focus:ring-official-teal/20" {...props} />
    </label>
  )
}
