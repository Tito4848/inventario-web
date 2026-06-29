import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import GenericDataTable from '../components/table/GenericDataTable'
import Pagination from '../components/table/Pagination'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { getDefaultRoute } from '../lib/permissions'
import {
  fetchPurchaseLookups,
  fetchPurchases,
  PURCHASE_STATUS_OPTIONS,
  type PurchaseOrder,
} from '../lib/purchasesApi'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)
}

function statusClass(status: string) {
  switch (status) {
    case 'received':
      return 'text-emerald-600'
    case 'partial':
      return 'text-amber-600'
    case 'cancelled':
      return 'text-red-600'
    case 'pending':
      return 'text-blue-600'
    default:
      return 'text-slate-600'
  }
}

export default function Compras() {
  const { permissions, user } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [supplier, setSupplier] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const canView = Boolean(permissions?.canReadPurchases ?? permissions?.modules.includes('purchases'))
  const canCreate = Boolean(permissions?.canCreatePurchases)

  if (permissions && !canView) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const queryKey = useMemo(
    () => ['purchases', page, search, status, supplier, from, to],
    [page, search, status, supplier, from, to],
  )

  const { data: lookups } = useQuery({
    queryKey: ['purchase-lookups'],
    queryFn: fetchPurchaseLookups,
  })

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchPurchases({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
        supplier: supplier || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: canView,
  })

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar las compras." onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  const columns = [
    {
      key: 'orderNumber',
      label: 'N° Orden',
      render: (row: Record<string, unknown>) => {
        const order = row as unknown as PurchaseOrder
        return (
          <Link className="font-medium text-primary-600 hover:underline" to={`/app/compras/${order.id}`}>
            {order.orderNumber}
          </Link>
        )
      },
    },
    { key: 'orderDate', label: 'Fecha', render: (row: Record<string, unknown>) => formatDate(String(row.orderDate)) },
    { key: 'supplierName', label: 'Proveedor' },
    {
      key: 'statusLabel',
      label: 'Estado',
      render: (row: Record<string, unknown>) => (
        <span className={statusClass(String(row.status))}>{String(row.statusLabel)}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: Record<string, unknown>) =>
        formatMoney(Number(row.total), String(row.currency || 'PEN')),
    },
    { key: 'createdByName', label: 'Creador' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="mt-1 text-sm text-slate-500">Órdenes de compra y recepciones de mercadería</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {canCreate && (
            <Link to="/app/compras/nueva">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva compra
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="input-field"
          placeholder="Buscar por N° orden..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="input-field"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los estados</option>
          {PURCHASE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={supplier}
          onChange={(e) => {
            setSupplier(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los proveedores</option>
          {(lookups?.suppliers ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="input-field"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
        />
        <input
          type="date"
          className="input-field"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin órdenes de compra"
          description="Crea tu primera orden de compra vinculada a un proveedor."
          actionLabel={canCreate ? 'Nueva compra' : undefined}
          onAction={canCreate ? () => (window.location.href = '/app/compras/nueva') : undefined}
        />
      ) : (
        <>
          <GenericDataTable columns={columns} data={rows as unknown as Record<string, unknown>[]} />
          {data && (
            <Pagination
              page={data.page}
              pageCount={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
