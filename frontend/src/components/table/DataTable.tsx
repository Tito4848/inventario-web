import { useMemo, useState } from 'react'
import Table from '../ui/Table'
import Pagination from './Pagination'

export type ProductRow = {
  id: string
  name: string
  sku?: string
  barcode?: string
  description?: string
  category?: string
  subcategory?: string
  unit?: string
  purchasePrice?: number
  salePrice?: number
  stock: number
  minStock?: number
  status?: string
  supplier?: string
  createdAt?: string
  updatedAt?: string
}

type Props = {
  data: ProductRow[]
}

function exportCSV(rows: ProductRow[]) {
  const headers = [
    'id','name','sku','barcode','category','unit','purchasePrice','salePrice','stock','minStock','status','supplier','createdAt','updatedAt'
  ]
  const csv = [headers.join(',')]
  for (const r of rows) {
    const line = headers.map(h => {
      const v = (r as any)[h]
      if (v === undefined || v === null) return ''
      return `"${String(v).replace(/"/g,'""')}"`
    }).join(',')
    csv.push(line)
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'productos.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function DataTable({ data }: Props) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [query, setQuery] = useState('')
  const [sortKey] = useState<string | null>(null)
  const [sortDir] = useState<'asc'|'desc'>('asc')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = data
    if (q) rows = rows.filter(r => (r.name + ' ' + (r.sku ?? '') + ' ' + (r.category ?? '')).toLowerCase().includes(q))
    if (sortKey) {
      rows = [...rows].sort((a:any,b:any) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        if (av === bv) return 0
        if (sortDir === 'asc') return av > bv ? 1 : -1
        return av > bv ? -1 : 1
      })
    }
    return rows
  }, [data, query, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData = filtered.slice((page-1)*pageSize, page*pageSize)

  const toggleSelectAll = (v: boolean) => {
    const newSel: Record<string, boolean> = {}
    for (const r of pageData) newSel[r.id] = v
    setSelected(prev => ({ ...prev, ...newSel }))
  }

  const selectedRows = Object.keys(selected).filter(k => selected[k])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input placeholder="Buscar productos..." className="px-3 py-2 rounded-md bg-white/5" value={query} onChange={e=>setQuery(e.target.value)} />
          <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value)); setPage(1)}} className="px-2 py-1 rounded-md bg-white/5">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-md bg-white/5" onClick={() => exportCSV(filtered)}>Export CSV</button>
          <button className="px-3 py-1 rounded-md bg-red-600 text-white" onClick={() => alert('Bulk delete: '+selectedRows.length)}>Eliminar seleccionados</button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th className="text-left px-3 py-2"><input type="checkbox" onChange={e => toggleSelectAll(e.target.checked)} /></th>
            <th className="text-left px-3 py-2">Nombre</th>
            <th className="text-left px-3 py-2">SKU</th>
            <th className="text-left px-3 py-2">Categoría</th>
            <th className="text-left px-3 py-2">Stock</th>
            <th className="text-left px-3 py-2">Precio venta</th>
            <th className="text-left px-3 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map(row => (
            <tr key={row.id} className="odd:bg-white/2 even:bg-transparent">
              <td className="px-3 py-2"><input type="checkbox" checked={!!selected[row.id]} onChange={e=>setSelected(s=>({...s,[row.id]:e.target.checked}))} /></td>
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2">{row.sku}</td>
              <td className="px-3 py-2">{row.category}</td>
              <td className={`px-3 py-2 ${row.stock <= (row.minStock ?? 0) ? 'text-red-500' : 'text-green-500'}`}>{row.stock}</td>
              <td className="px-3 py-2">{row.salePrice?.toFixed?.(2) ?? '-'}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-white/5">Editar</button>
                  <button className="px-2 py-1 rounded bg-white/5">Duplicar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">{filtered.length} productos</div>
        <Pagination page={page} pageCount={pageCount} onPageChange={p=>setPage(p)} />
      </div>
    </div>
  )
}
