import React from 'react'

export default function ChartCard({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl glass-card shadow-soft">
      {title && <div className="text-sm text-gray-400">{title}</div>}
      <div className="mt-3">{children ?? <div className="h-40 bg-gradient-to-b from-white/5 to-white/2 rounded-md" />}</div>
    </div>
  )
}
