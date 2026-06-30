import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import GenericDataTable from '../components/table/GenericDataTable'
import Pagination from '../components/table/Pagination'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute, resolveSalesPermissions } from '../lib/permissions'
import {
  cancelSale,
  deleteSale,
  fetchSaleLookups,
  fetchSales,
  fetchSaleStats,
  formatSaleDate,
  formatSaleMoney,
  SALE_SORT_OPTIONS,
  SALE_STATUS_OPTIONS,
  saleStatusClass,
  type SaleOrder,
} from '../lib/salesApi'

function canConfirmStatus(status: string) {
  return status === 'draft' || status === 'pending'
}

function canDeliverStatus(status: string) {
  return status === 'confirmed'
}

function canCancelStatus(status: string) {
  return status === 'draft' || status === 'pending' || status === 'confirmed'
}

function canReturnStatus(status: string) {
  return status === 'delivered'
}

function canEditStatus(status: string) {
  return status === 'draft' || status === 'pending'
}

function canDeleteStatus(status: string) {
  return status === 'draft' || status === 'pending' || status === 'cancelled'
}

export default function Ventas() {
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()
  const salesPerms = resolveSalesPermissions(user, permissions)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [customer, setCustomer] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('-saleDate')
  const [pendingOnly, setPendingOnly] = useState(false)

  if (permissions && !salesPerms.canReadSales) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const queryKey = useMemo(
    () => ['sales', page, search, status, customer, createdBy, from, to, sort, pendingOnly],
    [page, search, status, customer, createdBy, from, to, sort, pendingOnly],
  )

  const { data: lookups } = useQuery({
    queryKey: ['sale-lookups'],
    queryFn: fetchSaleLookups,
  })

  const { data: stats } = useQuery({
    queryKey: ['sale-stats'],
    queryFn: fetchSaleStats,
    enabled: salesPerms.canReadSales,
  })

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchSales({
        page,
        limit: 20,
        sort,
        search: search || undefined,
        status: status || undefined,
        customer: customer || undefined,
        createdBy: createdBy || undefined,
        from: from || undefined,
        to: to || undefined,
        pending: pendingOnly || undefined,
      }),
    enabled: salesPerms.canReadSales,
  })

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string
      action: 'cancel' | 'delete'
    }) => {
      if (action === 'cancel') return cancelSale(id)
      return deleteSale(id)
    },
    onSuccess: (_, vars) => {
      addNotification({
        type: 'success',
        title: 'Ventas',
        message: vars.action === 'cancel' ? 'Venta cancelada' : 'Venta eliminada',
      })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale-stats'] })
      if (vars.action === 'delete') return
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar las ventas." onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  const columns = [
    {
      key: 'orderNumber',
      label: 'N° Orden',
      render: (row: Record<string, unknown>) => {
        const order = row as unknown as SaleOrder
        return (
          <Link className="font-medium text-primary-600 hover:underline" to={`/app/ventas/${order.id}`}>
            {order.orderNumber}
          </Link>
        )
      },
    },
    {
      key: 'saleDate',
      label: 'Fecha',
      render: (row: Record<string, unknown>) => formatSaleDate(String(row.saleDate)).split(',')[0],
    },
    { key: 'customerName', label: 'Cliente' },
    {
      key: 'statusLabel',
      label: 'Estado',
      render: (row: Record<string, unknown>) => (
        <span className={saleStatusClass(String(row.status))}>{String(row.statusLabel)}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (row: Record<string, unknown>) => formatSaleMoney(Number(row.total)),
    },
    { key: 'createdByName', label: 'Usuario' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row: Record<string, unknown>) => {
        const order = row as unknown as SaleOrder
        return (
          <div className="flex flex-wrap gap-1">
            <Link to={`/app/ventas/${order.id}`} title="Detalle">
              <Button variant="outline" className="h-8 w-8 p-0">
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </Link>
            {salesPerms.canUpdateSales && canEditStatus(order.status) && (
              <Link to={`/app/ventas/${order.id}?edit=1`} title="Editar">
                <Button variant="outline" className="h-8 w-8 p-0">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {salesPerms.canConfirmSales && canConfirmStatus(order.status) && (
              <Link to={`/app/ventas/${order.id}/confirmar`} title="Confirmar">
                <Button variant="outline" className="h-8 w-8 p-0">
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {salesPerms.canDeliverSales && canDeliverStatus(order.status) && (
              <Link to={`/app/ventas/${order.id}/entregar`} title="Entregar">
                <Button variant="outline" className="h-8 w-8 p-0">
                  <Truck className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {salesPerms.canCancelSales && canCancelStatus(order.status) && (
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                title="Cancelar"
                disabled={actionMutation.isPending}
                onClick={() => {
                  if (window.confirm('¿Cancelar esta venta?')) {
                    actionMutation.mutate({ id: order.id, action: 'cancel' })
                  }
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            {salesPerms.canReturnSales && canReturnStatus(order.status) && (
              <Link to={`/app/ventas/${order.id}/devolver`} title="Devolver">
                <Button variant="outline" className="h-8 w-8 p-0">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {salesPerms.canDeleteSales && canDeleteStatus(order.status) && (
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                title="Eliminar"
                disabled={actionMutation.isPending}
                onClick={() => {
                  if (window.confirm('¿Eliminar esta venta?')) {
                    actionMutation.mutate({ id: order.id, action: 'delete' })
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="mt-1 text-sm text-slate-500">Órdenes de venta, entregas e ingresos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {salesPerms.canCreateSales && (
            <Link to="/app/ventas/nueva">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva venta
              </Button>
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Ventas hoy</p>
            <p className="mt-1 text-2xl font-bold">{stats.dailyCount}</p>
            <p className="text-sm text-emerald-600">{formatSaleMoney(stats.dailyRevenue)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Ventas del mes</p>
            <p className="mt-1 text-2xl font-bold">{stats.monthlyCount}</p>
            <p className="text-sm text-emerald-600">{formatSaleMoney(stats.monthlyRevenue)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Pendientes / Confirmadas</p>
            <p className="mt-1 text-2xl font-bold">
              {stats.pendingOrders} / {stats.confirmedOrders}
            </p>
            <p className="text-sm text-slate-500">
              Entregadas: {stats.deliveredOrders} · Canceladas: {stats.cancelledOrders}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Top cliente</p>
            <p className="mt-1 truncate font-semibold">{stats.topCustomer?.name ?? '—'}</p>
            <p className="text-sm text-slate-500">{stats.topCustomer?.count ?? 0} ventas</p>
          </div>
        </div>
      )}

      {stats && (stats.topProducts.length > 0 || rows.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {stats.topProducts.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 font-semibold">Productos más vendidos</h2>
              <ul className="space-y-2 text-sm">
                {stats.topProducts.map((p) => (
                  <li key={p.id} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                    <span>{p.name}</span>
                    <span className="text-slate-500">{p.quantity} uds · {formatSaleMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rows.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 font-semibold">Últimas ventas</h2>
              <ul className="space-y-2 text-sm">
                {rows.slice(0, 5).map((order) => (
                  <li key={order.id} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                    <Link to={`/app/ventas/${order.id}`} className="text-primary-600 hover:underline">
                      {order.orderNumber}
                    </Link>
                    <span className={saleStatusClass(order.status)}>{order.statusLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
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
          {SALE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={customer}
          onChange={(e) => {
            setCustomer(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los clientes</option>
          {(lookups?.customers ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={createdBy}
          onChange={(e) => {
            setCreatedBy(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los usuarios</option>
          {(lookups?.users ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
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
        <select
          className="input-field"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
        >
          {SALE_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => {
              setPendingOnly(e.target.checked)
              setPage(1)
            }}
          />
          Solo pendientes
        </label>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin órdenes de venta"
          description="Crea tu primera venta vinculada a un cliente."
          actionLabel={salesPerms.canCreateSales ? 'Nueva venta' : undefined}
          onAction={salesPerms.canCreateSales ? () => navigate('/app/ventas/nueva') : undefined}
        />
      ) : (
        <>
          <GenericDataTable columns={columns} data={rows as unknown as Record<string, unknown>[]} />
          {data && (
            <Pagination page={data.page} pageCount={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
