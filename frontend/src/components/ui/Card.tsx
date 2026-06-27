import React from 'react'

export default function Card({ children, className = '' }: React.ComponentProps<'div'>) {
  return (
    <div className={`glass-card rounded-2xl p-4 shadow-glass ${className}`}>{children}</div>
  )
}
