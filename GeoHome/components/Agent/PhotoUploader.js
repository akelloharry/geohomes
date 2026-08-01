import { useMemo, useState } from 'react'

export default function PhotoUploader({ photos = [], onUpload, onRemove }) {
  const [previewUrls, setPreviewUrls] = useState([])

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || [])
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    onUpload?.(files)
  }

  const previewItems = useMemo(() => {
    if (previewUrls.length > 0) {
      return previewUrls
    }
    return photos || []
  }, [photos, previewUrls])

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-anchor-gray">Photos</p>
          <p className="text-sm text-slate-600">Upload multiple images for the listing.</p>
        </div>
        <label className="cursor-pointer rounded-full bg-official-teal px-4 py-2 text-xs font-semibold text-white transition hover:bg-muted-teal">
          Choose files
          <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFiles} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {previewItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-cloud-white p-8 text-center text-sm text-anchor-gray">No photos selected yet.</div>
        ) : (
          previewItems.map((src, index) => (
            <div key={index} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-cloud-white">
              <img src={src} alt={`Preview ${index + 1}`} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove?.(index)}
                className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-estate-red shadow-sm"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
