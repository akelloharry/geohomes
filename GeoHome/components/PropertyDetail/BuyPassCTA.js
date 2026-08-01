'use client'

export default function BuyPassCTA({ onBuyPass, buyingPass }) {
  return (
    <div className="mt-6 rounded-[24px] bg-[#F2FAF7] p-5 text-sm text-slate-700">
      <div className="mb-4 font-semibold text-[#1E3A4D]">Unlock full access</div>
      <p className="leading-relaxed text-slate-600">
        Activate a tenant search pass to view unit details, request viewings, and get route directions to this property.
      </p>
      <button
        type="button"
        onClick={onBuyPass}
        disabled={buyingPass}
        className="mt-5 w-full rounded-full bg-[#2C6E5C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#23594a] disabled:opacity-60"
      >
        {buyingPass ? 'Processing pass…' : 'Buy search pass — KES 200'}
      </button>
    </div>
  )
}
