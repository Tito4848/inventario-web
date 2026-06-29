import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import GenericDataTable from '../components/table/GenericDataTable'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import {
  fetchInventoryLookups,
  fetchStock,
  STOCK_STATUS_LABELS,
  type StockRow,
  type StockStatus,
} from '../lib/inventoryApi'
import { getDefaultRoute } from '../lib/permissions'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function productName(row: StockRow): string {
  const p = asRecord(row.product)
  return p?.name ? String(p.name) : '—'
}

function statusClass(status: StockStatus): string {
  if (status === 'out') return 'text-red-600'
  if (status === 'low') return 'text-amber-600'
  if (status === 'over_max') return 'text-blue-600'
  return 'text-emerald-600'
}

export default function Stock() {
  const { permissions, user } = useAuth()
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('')
  const [rack, setRack] = useState('')
  const [belowMin, setBelowMin] = useState(false)
  const [outOfStock, setOutOfStock] = useState(false)
  const [aggregate, setAggregate] = useState(true)

  const canView = Boolean(permissions?.modules.includes('stock'))

  if (permissions && !canView) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const queryKey = useMemo(
    () => ['stock', product, category, rack, belowMin, outOfStock, aggregate],
    [product, category, rack, belowMin, outOfStock, aggregate],
  )

  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['inventory-lookups'],
    queryFn: fetchInventoryLookups,
  })

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchStock({
        product: product || undefined,
        category: category || undefined,
        rack: aggregate ? undefined : rack || undefined,
        belowMin,
        outOfStock,
        aggregate,
      }),
    enabled: canView,
  })

  if (lookupsLoading || isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudo cargar el stock." onRetry={() => refetch()} />

  const rows = data?.docs ?? []
  const alertCount = rows.filter((r) => r.stockStatus === 'out' || r.stockStatus === 'low').length

  const columns = [
    { key: 'product', label: 'Producto', render: (row: Record<string, unknown>) => productName(row as unknown as StockRow) },
    ...(aggregate
      ? []
      : [{
          key: 'rack',
          label: 'Rack',
          render: (row: Record<string, unknown>) => {
            const r = asRecord((row as unknown as StockRow).rack)
            return r?.name ? String(r.name) : '—'
          },
        }]),
    { key: 'quantityBase', label: 'Stock actual', render: (row: Record<string, unknown>) => Number(row.quantityBase).toFixed(4) },
    { key: 'availableQtyBase', label: 'Disponible', render: (row: Record<string, unknown>) => Number(row.availableQtyBase).toFixed(4) },
    { key: 'reservedQtyBase', label: 'Reservado', render: (row: Record<string, unknown>) => Number(row.reservedQtyBase).toFixed(4) },
    { key: 'minStockBase', label: 'Mínimo', render: (row: Record<string, unknown>) => Number(row.minStockBase).toFixed(4) },
    {
      key: 'maxStockBase',
      label: 'Máximo',
      render: (row: Record<string, unknown>) =>
        row.maxStockBase != null ? Number(row.maxStockBase).toFixed(4) : '—',
    },
    {
      key: 'stockStatus',
      label: 'Estado',
      render: (row: Record<string, unknown>) => (
        <span className={statusClass(row.stockStatus as StockStatus)}>
          {STOCK_STATUS_LABELS[row.stockStatus as StockStatus] ?? String(row.stockStatus)}
        </span>
      ),
    },
    { key: 'value', label: 'Valor', render: (row: Record<string, unknown>) => Number(row.value).toFixed(2) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="mt-1 text-sm text-slate-500">Consulta en tiempo real desde movimientos de inventario</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {alertCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {alertCount} producto(s) con alerta de stock
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Producto</label>
          <select className="input w-full" value={product} onChange={(e) => setProduct(e.target.value)}>
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
          <select className="input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {lookups?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rack</label>
          <select
            className="input w-full"
            value={rack}
            onChange={(e) => setRack(e.target.value)}
            disabled={aggregate}
          >
            <option value="">Todos</option>
            {lookups?.racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={aggregate} onChange={(e) => setAggregate(e.target.checked)} />
            Por producto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={belowMin} onChange={(e) => setBelowMin(e.target.checked)} />
            Bajo mínimo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={outOfStock} onChange={(e) => setOutOfStock(e.target.checked)} />
            Agotados
          </label>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Sin stock registrado" description="Registra entradas para ver niveles de inventario." />
      ) : (
        <GenericDataTable columns={columns} data={rows as unknown as Record<string, unknown>[]} />
      )}
    </div>
  )
}
