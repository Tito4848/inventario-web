import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import GenericDataTable from '../components/table/GenericDataTable'
import Pagination from '../components/table/Pagination'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import {
  fetchInventoryLookups,
  fetchMovements,
  MOVEMENT_TYPE_OPTIONS,
  type MovementRow,
} from '../lib/inventoryApi'
import { getDefaultRoute } from '../lib/permissions'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function Movimientos() {
  const { permissions, user } = useAuth()
  const [page, setPage] = useState(1)
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('')
  const [rack, setRack] = useState('')
  const [movementType, setMovementType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const canView = Boolean(permissions?.modules.includes('movements'))

  if (permissions && !canView) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const queryKey = useMemo(
    () => ['movements', page, product, category, rack, movementType, from, to],
    [page, product, category, rack, movementType, from, to],
  )

  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['inventory-lookups'],
    queryFn: fetchInventoryLookups,
  })

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchMovements({
        page,
        limit: 50,
        product: product || undefined,
        category: category || undefined,
        rack: rack || undefined,
        movementType: movementType || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: canView,
  })

  if (lookupsLoading || isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar los movimientos." onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  const columns = [
    { key: 'date', label: 'Fecha', render: (row: Record<string, unknown>) => formatDate(String(row.date)) },
    { key: 'movementTypeLabel', label: 'Tipo' },
    {
      key: 'productName',
      label: 'Producto',
      render: (row: Record<string, unknown>) => {
        const m = row as unknown as MovementRow
        return `${m.productCode ? `${m.productCode} — ` : ''}${m.productName}`
      },
    },
    { key: 'rackName', label: 'Rack' },
    { key: 'quantity', label: 'Cantidad', render: (row: Record<string, unknown>) => Number(row.quantity).toFixed(4) },
    { key: 'quantityBase', label: 'Cant. base', render: (row: Record<string, unknown>) => Number(row.quantityBase).toFixed(4) },
    { key: 'totalValue', label: 'Valor', render: (row: Record<string, unknown>) => Number(row.totalValue).toFixed(2) },
    {
      key: 'document',
      label: 'Documento',
      render: (row: Record<string, unknown>) => {
        const m = row as unknown as MovementRow
        return (
          <div>
            <div>{m.document}</div>
            {m.notes ? <div className="text-xs text-slate-500">{m.notes}</div> : null}
          </div>
        )
      },
    },
    { key: 'createdByName', label: 'Usuario' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Movimientos</h1>
          <p className="mt-1 text-sm text-slate-500">Historial de entradas, salidas y ajustes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Producto</label>
          <select className="input w-full" value={product} onChange={(e) => { setProduct(e.target.value); setPage(1) }}>
            <option value="">Todos</option>
            {lookups?.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} — ` : ''}
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría</label>
          <select className="input w-full" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option value="">Todas</option>
            {lookups?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo</label>
          <select className="input w-full" value={movementType} onChange={(e) => { setMovementType(e.target.value); setPage(1) }}>
            {MOVEMENT_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rack</label>
          <select className="input w-full" value={rack} onChange={(e) => { setRack(e.target.value); setPage(1) }}>
            <option value="">Todos</option>
            {lookups?.racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Desde</label>
          <input className="input w-full" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Hasta</label>
          <input className="input w-full" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="Registra entradas o salidas para ver el historial."
        />
      ) : (
        <>
          <GenericDataTable columns={columns} data={rows as unknown as Record<string, unknown>[]} />
          {data && data.totalPages > 1 && (
            <Pagination page={page} pageCount={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
