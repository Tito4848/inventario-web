import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute, resolveSalesPermissions } from '../lib/permissions'
import { fetchSale, returnSale } from '../lib/salesApi'

export default function VentaDevolver() {
  const { id = '' } = useParams()
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const salesPerms = resolveSalesPermissions(user, permissions)

  if (permissions && !salesPerms.canReturnSales) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => fetchSale(id),
    enabled: Boolean(id),
  })

  const mutation = useMutation({
    mutationFn: () => returnSale(id),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Venta devuelta' })
      navigate(`/app/ventas/${id}`)
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (isLoading) return <PageSkeleton />
  if (error || !orderData) return <ErrorState message="No se pudo cargar la venta." />

  const order = orderData.doc
  if (order.status !== 'delivered') {
    return <Navigate to={`/app/ventas/${id}`} replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (window.confirm('¿Registrar devolución de esta venta? Se revertirá el stock.')) {
      mutation.mutate()
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/app/ventas/${id}`} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Devolver — {order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Registra la devolución de productos entregados</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-5 text-sm">
          <p><span className="text-slate-500">Cliente:</span> {order.customerName}</p>
          <p className="mt-1"><span className="text-slate-500">Entregada:</span> {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : '-'}</p>
          <p className="mt-1"><span className="text-slate-500">Total:</span> S/ {order.total.toFixed(2)}</p>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 font-semibold">Productos entregados</h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item, idx) => (
              <li key={item.id ?? idx} className="flex justify-between border-b py-2">
                <span>{item.productName}</span>
                <span className="text-slate-500">{item.quantity} uds</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Esta acción registrará la devolución completa de la venta en el backend.
        </div>

        <div className="flex justify-end gap-3">
          <Link to={`/app/ventas/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={mutation.isPending}>
            <RotateCcw className="h-4 w-4" />
            {mutation.isPending ? 'Procesando...' : 'Confirmar devolución'}
          </Button>
        </div>
      </form>
    </div>
  )
}
