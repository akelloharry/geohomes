export default function LandlordCard({ landlord, hasPass }) {
  const name = landlord?.full_name || 'Landlord'

  return (
    <div className="mt-4 flex items-center gap-4 rounded-[24px] bg-[#F4F6F9] p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5F8A7B] text-lg font-bold text-white">
        {name.split(' ').map((n) => n[0]).join('')}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-[#1E3A4D]">{name}</div>
        <div className="text-sm text-[#5B6F82]">⭐ Usually responds in a few hours</div>
        {hasPass && landlord?.phone ? <div className="text-sm text-[#5B6F82]">📞 Phone shared on request</div> : null}
      </div>
    </div>
  )
}
