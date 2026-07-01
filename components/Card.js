export default function Card({ children, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-pale-steel bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  )
}
