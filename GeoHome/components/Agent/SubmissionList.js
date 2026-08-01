import Link from 'next/link'
import StatusBadge from './StatusBadge'

export default function SubmissionList({ submissions = [], onDelete }) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-[28px] border border-pale-steel bg-white p-8 text-center text-sm text-anchor-gray shadow-sm">
        No submissions yet. Start by creating a new property submission.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-pale-steel bg-white shadow-sm">
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr] gap-4 bg-cloud-white px-6 py-4 text-left text-xs uppercase tracking-[0.24em] text-anchor-gray">
        <span>Address</span>
        <span>Rent</span>
        <span>Type</span>
        <span>Status</span>
        <span>Submitted</span>
        <span>Actions</span>
      </div>
      {submissions.map((submission) => (
        <div key={submission.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr] gap-4 border-t border-slate-100 px-6 py-4 text-sm text-deep-maritime">
          <div>
            <div className="font-semibold">{submission.address}</div>
            <div className="mt-1 text-xs text-anchor-gray">{submission.landlord_name}</div>
          </div>
          <div className="font-semibold">KES {submission.rent?.toLocaleString()}</div>
          <div>{submission.property_type || 'Unknown'}</div>
          <div><StatusBadge status={submission.status} /></div>
          <div className="text-anchor-gray">{new Date(submission.created_at).toLocaleDateString()}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/agent/submissions/${submission.id}`} className="rounded-full border border-official-teal px-3 py-1 text-[11px] font-semibold text-official-teal hover:bg-official-teal/10">
              View
            </Link>
            {submission.status === 'pending_review' && (
              <>
                <Link href={`/agent/submissions/${submission.id}`} className="rounded-full bg-muted-teal px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#4e8c7d]">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(submission.id)}
                  className="rounded-full bg-estate-red px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#9e4b43]"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
