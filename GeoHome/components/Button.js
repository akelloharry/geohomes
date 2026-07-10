"use client"

export default function Button({ children, onClick, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded font-medium'
  const variants = {
    primary: 'bg-official-teal text-white',
    ghost: 'bg-white border',
    danger: 'bg-estate-red text-white'
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}
