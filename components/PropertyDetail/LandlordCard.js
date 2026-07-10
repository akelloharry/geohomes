export default function LandlordCard({ landlord, hasPass }) {
  const name = landlord?.full_name || 'Landlord'

  return (
    <div className="bg-[#F4F6F9] rounded-lg p-4 mt-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[#5F8A7B] text-white flex items-center justify-center font-bold text-lg">
        {name.split(' ').map((n) => n[0]).join('')}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-[#1E3A4D]">{name}</div>
        <div className="text-sm text-[#5B6F82]">⭐ Usually responds in a few hours</div>
        {hasPass && landlord?.phone && (
          <div className="text-sm text-[#5B6F82]">📞 Phone shared on request</div>
        )}
      </div>
    </div>
  )
}
