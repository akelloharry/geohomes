export default function StatusBadge({ status }) {
  const normalized = status?.replace('_', ' ') ?? 'unknown'
  const classes = {
    pending_review: 'bg-[#FEF3C7] text-[#92400E]',
    approved: 'bg-[#D1FAE5] text-[#047857]',
    rejected: 'bg-[#FEE2E2] text-[#B91C1C]'
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {normalized}
    </span>
  )
}
