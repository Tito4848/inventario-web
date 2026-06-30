import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute, resolveSalesPermissions } from '../lib/permissions'
import { confirmSale, fetchSale, fetchSaleLookups } from '../lib/salesApi'

export default function VentaConfirmar() {
  const { id = '' } = useParams()
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const salesPerms = resolveSalesPermissions(user, permissions)

  if (permissions && !salesPerms.canConfirmSales) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => fetchSale(id),
    enabled: Boolean(id),
  })

  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['sale-lookups'],
    queryFn: fetchSaleLookups,
  })

  const [rack, setRack] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () => confirmSale(id, { rack: rack || undefined, notes: notes || undefined }),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Venta confirmada' })
      navigate(`/app/ventas/${id}`)
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (isLoading || lookupsLoading) return <PageSkeleton />
  if (error || !orderData) return <ErrorState message="No se pudo cargar la venta." />

  const order = orderData.doc
  if (order.status !== 'draft' && order.status !== 'pending') {
    return <Navigate to={`/app/ventas/${id}`} replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/app/ventas/${id}`} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Confirmar — {order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Confirma la venta comercialmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Rack (opcional)</span>
            <select className="input-field w-full" value={rack} onChange={(e) => setRack(e.target.value)}>
              <option value="">Usar rack de la orden</option>
              {(lookups?.racks ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Observaciones</span>
            <textarea className="input-field w-full min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <div className="glass-card p-5 text-sm">
          <p><span className="text-slate-500">Cliente:</span> {order.customerName}</p>
          <p className="mt-1"><span className="text-slate-500">Total:</span> S/ {order.total.toFixed(2)}</p>
          <p className="mt-1"><span className="text-slate-500">Productos:</span> {order.items.length}</p>
        </div>

        <div className="flex justify-end gap-3">
          <Link to={`/app/ventas/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={mutation.isPending}>
            <CheckCircle className="h-4 w-4" />
            {mutation.isPending ? 'Confirmando...' : 'Confirmar venta'}
          </Button>
        </div>
      </form>
    </div>
  )
}
