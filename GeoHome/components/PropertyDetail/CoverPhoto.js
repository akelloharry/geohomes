'use client'

import { useState } from 'react'

export default function CoverPhoto({ photos }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  if (!photos || photos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 md:h-96">
        <span className="text-[#5B6F82]">No photos available</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative aspect-video max-h-[480px] overflow-hidden rounded-[28px] bg-[#1E3A4D]">
        <img src={photos[selectedImage]} alt="Property cover" className="h-full w-full object-cover" />
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
        >
          View gallery
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FBBF24] text-xs font-bold text-[#1E3A4D]">
            {photos.length}
          </span>
        </button>
      </div>

      {photos.length > 1 ? (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              onClick={() => setSelectedImage(index)}
              className={`overflow-hidden rounded-2xl border-2 transition ${selectedImage === index ? 'border-[#2C6E5C]' : 'border-transparent'}`}
            >
              <img src={photo} alt={`Thumbnail ${index + 1}`} className="h-16 w-full object-cover transition hover:opacity-80" />
            </button>
          ))}
        </div>
      ) : null}

      {isGalleryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-white">
            <button onClick={() => setIsGalleryOpen(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              Close
            </button>
            <img src={photos[selectedImage]} alt="Gallery photo" className="h-[70vh] w-full object-cover" />
            <div className="grid grid-cols-5 gap-2 border-t border-slate-200 bg-slate-50 p-3">
              {photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-2xl border ${selectedImage === index ? 'border-[#2C6E5C]' : 'border-slate-200'}`}
                >
                  <img src={photo} alt={`Gallery photo ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
