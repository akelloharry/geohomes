'use client'

import { useState } from 'react'

export default function CoverPhoto({ photos }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-[#F4F6F9] rounded-xl h-64 md:h-96 flex items-center justify-center">
        <span className="text-[#5B6F82]">No photos available</span>
      </div>
    )
  }

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-[#1E3A4D] aspect-video max-h-[480px]">
        <img src={photos[selectedImage]} alt="Property cover" className="w-full h-full object-cover" />
        <button
          onClick={() => setIsGalleryOpen(true)}
          className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-black/90 transition"
        >
          View Gallery
          <span className="bg-[#FBBF24] text-[#1E3A4D] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {photos.length}
          </span>
        </button>
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`rounded-lg overflow-hidden border-2 transition ${selectedImage === index ? 'border-[#2C6E5C]' : 'border-transparent'}`}
            >
              <img
                src={photo}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-16 object-cover hover:opacity-80 transition"
              />
            </button>
          ))}
        </div>
      )}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white">
            <button onClick={() => setIsGalleryOpen(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Close</button>
            <img src={photos[selectedImage]} alt="Gallery photo" className="h-[70vh] w-full object-cover" />
            <div className="grid grid-cols-5 gap-2 border-t border-slate-200 bg-slate-50 p-3">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-2xl border ${selectedImage === index ? 'border-[#2C6E5C]' : 'border-slate-200'}`}
                >
                  <img src={photo} alt={`Gallery photo ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
