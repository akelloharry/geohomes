"use client"

export default function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const base = 'rounded-full px-4 py-2 text-sm font-semibold transition duration-200'
  const variants = {
    primary: 'bg-official-teal text-white shadow-sm hover:bg-deep-maritime',
    ghost: 'border border-pale-steel bg-white text-deep-maritime hover:bg-cloud-white',
    danger: 'bg-estate-red text-white hover:bg-rose-700'
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
