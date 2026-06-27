import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline'
}

export default function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  const base = 'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition'
  const variants: Record<string, string> = {
    primary: 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-soft hover:opacity-95',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50',
    outline: 'bg-transparent border border-gray-200 text-gray-800',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
