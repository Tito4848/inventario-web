import React from 'react'

export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white/5 p-2">
      <table className="min-w-full table-auto text-sm">{children}</table>
    </div>
  )
}
