import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PackageCheck, Trash2 } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute } from '../lib/permissions'
import {
  deletePurchase,
  fetchPurchase,
  updatePurchase,
} from '../lib/purchasesApi'

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)
}

export default function CompraDetalle() {
  const { id = '' } = useParams()
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()

  const canView = Boolean(permissions?.canReadPurchases ?? permissions?.modules.includes('purchases'))
  const canUpdate = Boolean(permissions?.canUpdatePurchases)
  const canDelete = Boolean(permissions?.canDeletePurchases)
  const canReceive = Boolean(permissions?.canReceivePurchases)

  if (permissions && !canView) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => fetchPurchase(id),
    enabled: Boolean(id) && canView,
  })

  const cancelMutation = useMutation({
    mutationFn: () => updatePurchase(id, { status: 'cancelled' }),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Compra', message: 'Orden cancelada' })
      queryClient.invalidateQueries({ queryKey: ['purchase', id] })
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePurchase(id),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Compra', message: 'Orden eliminada' })
      navigate('/app/compras')
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (isLoading) return <PageSkeleton />
  if (error || !data) return <ErrorState message="No se pudo cargar la orden." onRetry={() => refetch()} />

  const order = data.doc
  const canReceiveOrder = canReceive && ['pending', 'partial'].includes(order.status)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/app/compras" className="mt-1 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-slate-500">
              {order.supplierName} · {order.statusLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReceiveOrder && (
            <Link to={`/app/compras/${id}/recepcion`}>
              <Button><PackageCheck className="h-4 w-4" /> Recepcionar</Button>
            </Link>
          )}
          {canUpdate && order.status !== 'cancelled' && order.status !== 'received' && (
            <Button variant="outline" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancelar orden
            </Button>
          )}
          {canDelete && ['draft', 'pending', 'cancelled'].includes(order.status) && (
            <Button variant="outline" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card space-y-2 p-5 text-sm">
          <div><span className="text-slate-500">Fecha:</span> {formatDate(order.orderDate)}</div>
          <div><span className="text-slate-500">Proveedor:</span> {order.supplierName}</div>
          <div><span className="text-slate-500">Creador:</span> {order.createdByName || '-'}</div>
          <div><span className="text-slate-500">Moneda:</span> {order.currency}</div>
          {order.notes && <div><span className="text-slate-500">Observaciones:</span> {order.notes}</div>}
        </div>
        <div className="glass-card space-y-2 p-5 text-sm">
          <div>Subtotal: {formatMoney(order.subtotal, order.currency)}</div>
          <div>Descuento: {formatMoney(order.discount, order.currency)}</div>
          <div>Impuestos: {formatMoney(order.tax, order.currency)}</div>
          <div className="text-lg font-bold">Total: {formatMoney(order.total, order.currency)}</div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto p-5">
        <h2 className="mb-4 font-semibold">Detalle</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Producto</th>
              <th className="py-2">Cantidad</th>
              <th className="py-2">Recibida</th>
              <th className="py-2">Pendiente</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Desc.</th>
              <th className="py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id ?? idx} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2">{item.productCode ? `${item.productCode} — ` : ''}{item.productName}</td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{item.quantityReceived}</td>
                <td className="py-2">{item.pendingQuantity}</td>
                <td className="py-2">{item.unitCost.toFixed(2)}</td>
                <td className="py-2">{item.discount.toFixed(2)}</td>
                <td className="py-2">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.receptions.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="mb-4 font-semibold">Recepciones</h2>
          <div className="space-y-4">
            {order.receptions.map((rec, idx) => (
              <div key={rec.id ?? idx} className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-700/60">
                <div className="text-sm text-slate-500">
                  {formatDate(rec.date)} · {rec.receivedByName || 'Usuario'}
                </div>
                {rec.notes && <p className="mt-1 text-sm">{rec.notes}</p>}
                <ul className="mt-2 text-sm">
                  {(rec.items ?? []).map((item, i) => (
                    <li key={i}>{item.productName}: {item.quantity}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
