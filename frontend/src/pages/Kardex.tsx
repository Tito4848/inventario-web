import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
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
  fetchKardex,
  MOVEMENT_TYPE_OPTIONS,
  type KardexRow,
} from '../lib/inventoryApi'
import { getDefaultRoute } from '../lib/permissions'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function Kardex() {
  const { permissions, user } = useAuth()
  const [product, setProduct] = useState('')
  const [category, setCategory] = useState('')
  const [rack, setRack] = useState('')
  const [movementType, setMovementType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const canView = Boolean(permissions?.modules.includes('kardex'))

  if (permissions && !canView) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const canQuery = Boolean(product || category)

  const queryKey = useMemo(
    () => ['kardex', product, category, rack, movementType, from, to, submitted],
    [product, category, rack, movementType, from, to, submitted],
  )

  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['inventory-lookups'],
    queryFn: fetchInventoryLookups,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchKardex({
        product: product || undefined,
        category: category || undefined,
        rack: rack || undefined,
        movementType: movementType || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: canView && submitted && canQuery,
  })

  if (lookupsLoading) return <PageSkeleton />

  const rows = data?.docs ?? []

  const columns = [
    { key: 'date', label: 'Fecha', render: (row: Record<string, unknown>) => formatDate(String(row.date)) },
    { key: 'movementTypeLabel', label: 'Tipo' },
    {
      key: 'document',
      label: 'Documento',
      render: (row: Record<string, unknown>) => {
        const m = row as unknown as KardexRow
        const rackRec = asRecord(m.rack)
        return (
          <div>
            <div>{m.document}</div>
            {rackRec?.name ? <div className="text-xs text-slate-500">{String(rackRec.name)}</div> : null}
            {m.notes ? <div className="text-xs text-slate-500">{m.notes}</div> : null}
          </div>
        )
      },
    },
    { key: 'inQty', label: 'Entrada', render: (row: Record<string, unknown>) => Number(row.inQty).toFixed(4) },
    { key: 'outQty', label: 'Salida', render: (row: Record<string, unknown>) => Number(row.outQty).toFixed(4) },
    { key: 'previousQty', label: 'Stock anterior', render: (row: Record<string, unknown>) => Number(row.previousQty).toFixed(4) },
    { key: 'newQty', label: 'Stock nuevo', render: (row: Record<string, unknown>) => Number(row.newQty).toFixed(4) },
    { key: 'createdByName', label: 'Usuario' },
    { key: 'balanceValue', label: 'Valor saldo', render: (row: Record<string, unknown>) => Number(row.balanceValue).toFixed(2) },
  ]

  function handleSearch() {
    if (!canQuery) return
    setSubmitted(true)
    refetch()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kardex FIFO</h1>
        <p className="mt-1 text-sm text-slate-500">
          Entradas, salidas, costos, saldos y valorización desde MongoDB
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Producto</label>
          <select className="input w-full" value={product} onChange={(e) => { setProduct(e.target.value); setSubmitted(false) }}>
            <option value="">Seleccionar…</option>
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
          <select
            className="input w-full"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubmitted(false) }}
            disabled={Boolean(product)}
          >
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
          <select className="input w-full" value={movementType} onChange={(e) => setMovementType(e.target.value)} disabled={!canQuery}>
            {MOVEMENT_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rack</label>
          <select className="input w-full" value={rack} onChange={(e) => setRack(e.target.value)} disabled={!canQuery}>
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
          <input className="input w-full" type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={!canQuery} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Hasta</label>
          <input className="input w-full" type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={!canQuery} />
        </div>
      </div>

      <Button onClick={handleSearch} disabled={!canQuery || isLoading}>
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? 'Consultando…' : 'Consultar'}
      </Button>

      {error && <ErrorState message="No se pudo cargar el kardex." onRetry={() => refetch()} />}

      {!submitted || !canQuery ? (
        <EmptyState
          title="Selecciona un producto o categoría"
          description="El kardex se genera a partir de los movimientos reales de inventario."
        />
      ) : isLoading ? (
        <PageSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="Sin movimientos" description="No hay registros para el filtro seleccionado." />
      ) : (
        <GenericDataTable columns={columns} data={rows as unknown as Record<string, unknown>[]} />
      )}
    </div>
  )
}
