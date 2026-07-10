"use client"

export default function Input({ label, ...props }) {
  return (
    <label className="block text-sm">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <input className="w-full border px-2 py-1 rounded" {...props} />
    </label>
  )
}
