import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl p-6 rounded-2xl glass-card">
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  )
}
