import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute } from '../lib/permissions'
import {
  createPurchase,
  fetchPurchaseLookups,
  type PurchaseFormData,
} from '../lib/purchasesApi'

type LineItem = {
  product: string
  quantity: number
  unitCost: number
  discount: number
}

const emptyLine = (): LineItem => ({ product: '', quantity: 1, unitCost: 0, discount: 0 })

export default function CompraNueva() {
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()

  const canCreate = Boolean(permissions?.canCreatePurchases)
  if (permissions && !canCreate) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data: lookups, isLoading, error } = useQuery({
    queryKey: ['purchase-lookups'],
    queryFn: fetchPurchaseLookups,
  })

  const [supplier, setSupplier] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [currency, setCurrency] = useState('PEN')
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [rack, setRack] = useState('')
  const [status, setStatus] = useState<'draft' | 'pending'>('draft')
  const [items, setItems] = useState<LineItem[]>([emptyLine()])

  const mutation = useMutation({
    mutationFn: (data: PurchaseFormData) => createPurchase(data),
    onSuccess: (res) => {
      addNotification({ type: 'success', title: 'Compra', message: 'Orden de compra creada' })
      navigate(`/app/compras/${res.doc.id}`)
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, ...patch }
        if (patch.product && lookups) {
          const product = lookups.products.find((p) => p.id === patch.product)
          if (product && !item.unitCost) next.unitCost = product.purchasePrice
        }
        return next
      }),
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      supplier,
      orderDate: new Date(orderDate).toISOString(),
      status,
      currency,
      tax,
      discount,
      notes,
      rack: rack || undefined,
      items: items.filter((i) => i.product),
    })
  }

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar catálogos." />

  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.quantity * item.unitCost - item.discount),
    0,
  )
  const total = Math.max(0, subtotal - discount) + tax

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/compras" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva compra</h1>
          <p className="text-sm text-slate-500">Registra una orden de compra con detalle de productos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Proveedor *</span>
            <select className="input-field w-full" required value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              <option value="">Seleccionar...</option>
              {(lookups?.suppliers ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Fecha *</span>
            <input type="date" className="input-field w-full" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Moneda</span>
            <select className="input-field w-full" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="PEN">PEN</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Estado inicial</span>
            <select className="input-field w-full" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'pending')}>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Rack por defecto</span>
            <select className="input-field w-full" value={rack} onChange={(e) => setRack(e.target.value)}>
              <option value="">Sin rack predeterminado</option>
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

        <div className="glass-card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Detalle de productos</h2>
            <Button type="button" variant="outline" onClick={() => setItems((prev) => [...prev, emptyLine()])}>
              <Plus className="h-4 w-4" /> Agregar línea
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-slate-200/60 p-3 md:grid-cols-12 dark:border-slate-700/60">
                <label className="md:col-span-4 space-y-1 text-sm">
                  <span>Producto</span>
                  <select className="input-field w-full" required={index === 0} value={item.product} onChange={(e) => updateItem(index, { product: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {(lookups?.products ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Cantidad</span>
                  <input type="number" min="0.0001" step="any" className="input-field w-full" value={item.quantity} onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} />
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Precio</span>
                  <input type="number" min="0" step="any" className="input-field w-full" value={item.unitCost} onChange={(e) => updateItem(index, { unitCost: Number(e.target.value) })} />
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Descuento</span>
                  <input type="number" min="0" step="any" className="input-field w-full" value={item.discount} onChange={(e) => updateItem(index, { discount: Number(e.target.value) })} />
                </label>
                <div className="md:col-span-2 flex items-end justify-end">
                  {items.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card grid gap-4 p-5 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Descuento orden</span>
            <input type="number" min="0" className="input-field w-full" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Impuestos</span>
            <input type="number" min="0" className="input-field w-full" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
          </label>
          <div className="flex flex-col justify-end text-right">
            <div className="text-sm text-slate-500">Subtotal: {subtotal.toFixed(2)}</div>
            <div className="text-xl font-bold">Total: {total.toFixed(2)} {currency}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/app/compras"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Crear orden'}</Button>
        </div>
      </form>
    </div>
  )
}
