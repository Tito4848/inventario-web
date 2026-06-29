import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute } from '../lib/permissions'
import {
  fetchPurchase,
  fetchPurchaseLookups,
  receivePurchase,
} from '../lib/purchasesApi'

export default function CompraRecepcion() {
  const { id = '' } = useParams()
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  const canReceive = Boolean(permissions?.canReceivePurchases)
  if (permissions && !canReceive) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data: orderData, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => fetchPurchase(id),
    enabled: Boolean(id),
  })

  const { data: lookups, isLoading: lookupsLoading } = useQuery({
    queryKey: ['purchase-lookups'],
    queryFn: fetchPurchaseLookups,
  })

  const [rack, setRack] = useState('')
  const [notes, setNotes] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const mutation = useMutation({
    mutationFn: () =>
      receivePurchase(id, {
        rack,
        notes: notes || undefined,
        items: Object.entries(quantities)
          .filter(([, qty]) => qty > 0)
          .map(([product, quantity]) => ({ product, quantity })),
      }),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Recepción', message: 'Recepción registrada' })
      navigate(`/app/compras/${id}`)
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (orderLoading || lookupsLoading) return <PageSkeleton />
  if (orderError || !orderData) return <ErrorState message="No se pudo cargar la orden." />

  const order = orderData.doc
  if (!['pending', 'partial'].includes(order.status)) {
    return <Navigate to={`/app/compras/${id}`} replace />
  }

  const pendingItems = order.items.filter((item) => item.pendingQuantity > 0)

  function receiveAll() {
    const next: Record<string, number> = {}
    for (const item of pendingItems) next[item.product] = item.pendingQuantity
    setQuantities(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rack) {
      addNotification({ type: 'error', title: 'Validación', message: 'Seleccione un rack' })
      return
    }
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/app/compras/${id}`} className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Recepción — {order.orderNumber}</h1>
          <p className="text-sm text-slate-500">Registre cantidades parciales o completas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Rack destino *</span>
            <select className="input-field w-full" required value={rack} onChange={(e) => setRack(e.target.value)}>
              <option value="">Seleccionar rack...</option>
              {(lookups?.racks ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Observación</span>
            <textarea className="input-field w-full min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Productos pendientes</h2>
            <Button type="button" variant="outline" onClick={receiveAll}>Recibir todo</Button>
          </div>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.product} className="grid gap-3 rounded-xl border border-slate-200/60 p-3 md:grid-cols-3 dark:border-slate-700/60">
                <div className="md:col-span-2 text-sm">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-slate-500">Pendiente: {item.pendingQuantity}</div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={item.pendingQuantity}
                  step="any"
                  className="input-field"
                  placeholder="Cantidad a recibir"
                  value={quantities[item.product] ?? ''}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [item.product]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to={`/app/compras/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Procesando...' : 'Confirmar recepción'}</Button>
        </div>
      </form>
    </div>
  )
}
