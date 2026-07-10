'use client'

export default function ActionButtons({ hasPass, onContact, onRequestViewing, onSave, onBuyPass, requesting }) {
  return (
    <div className="mt-6 space-y-3">
      <button
        onClick={onContact}
        className="w-full rounded-full bg-[#2C6E5C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#23594a] transition"
      >
        Contact landlord
      </button>
      <button
        onClick={onRequestViewing}
        disabled={!hasPass || requesting}
        className="w-full rounded-full border border-[#2C6E5C] px-4 py-3 text-sm font-semibold text-[#2C6E5C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {requesting ? 'Requesting…' : 'Request viewing'}
      </button>
      <button
        onClick={onSave}
        className="w-full rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
      >
        Save property
      </button>
      {!hasPass && (
        <button
          onClick={onBuyPass}
          className="w-full rounded-full bg-[#2C6E5C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#23594a] transition"
        >
          Buy search pass
        </button>
      )}
    </div>
  )
}
