import React from 'react'
import Table from '../ui/Table'

type Column = {
  key: string
  label: string
  render?: (row: Record<string, unknown>) => React.ReactNode
}

type Props = {
  columns: Column[]
  data: Record<string, unknown>[]
}

export default function GenericDataTable({ columns, data }: Props) {
  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row.id)} className="border-t border-surface-border">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
