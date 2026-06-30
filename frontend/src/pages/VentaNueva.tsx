import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute, resolveSalesPermissions } from '../lib/permissions'
import {
  createSale,
  fetchSaleLookups,
  previewSaleTotals,
  type SaleFormData,
} from '../lib/salesApi'

type LineItem = {
  product: string
  quantity: number
  unitPrice: number
  discount: number
}

const emptyLine = (): LineItem => ({ product: '', quantity: 1, unitPrice: 0, discount: 0 })

export default function VentaNueva() {
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const salesPerms = resolveSalesPermissions(user, permissions)

  if (permissions && !salesPerms.canCreateSales) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data: lookups, isLoading, error } = useQuery({
    queryKey: ['sale-lookups'],
    queryFn: fetchSaleLookups,
  })

  const [customer, setCustomer] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))
  const [tax, setTax] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [rack, setRack] = useState('')
  const [status, setStatus] = useState<'draft' | 'pending'>('draft')
  const [items, setItems] = useState<LineItem[]>([emptyLine()])
  const [formError, setFormError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: SaleFormData) => createSale(data),
    onSuccess: (res) => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Orden de venta creada' })
      navigate(`/app/ventas/${res.doc.id}`)
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
          if (product && !item.unitPrice) next.unitPrice = product.salePrice
        }
        return next
      }),
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const validItems = items.filter((i) => i.product)
    if (!customer) {
      setFormError('Seleccione un cliente')
      return
    }
    if (!validItems.length) {
      setFormError('Agregue al menos un producto')
      return
    }
    for (const item of validItems) {
      if (item.quantity <= 0) {
        setFormError('Las cantidades deben ser mayores a cero')
        return
      }
      if (item.unitPrice < 0) {
        setFormError('Los precios no pueden ser negativos')
        return
      }
      if (item.discount < 0 || item.discount > 100) {
        setFormError('El descuento por línea debe estar entre 0 y 100 %')
        return
      }
    }
    mutation.mutate({
      customer,
      saleDate: new Date(saleDate).toISOString(),
      status,
      tax,
      discountAmount,
      notes: notes || undefined,
      rack: rack || undefined,
      items: validItems,
    })
  }

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar catálogos." />

  const { subtotal, total } = previewSaleTotals(items.filter((i) => i.product), discountAmount, tax)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/app/ventas" className="text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nueva venta</h1>
          <p className="text-sm text-slate-500">Registra una orden de venta con detalle de productos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {formError}
          </div>
        )}

        <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Cliente *</span>
            <select
              className="input-field w-full"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {(lookups?.customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Fecha *</span>
            <input
              type="date"
              className="input-field w-full"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Estado inicial</span>
            <select
              className="input-field w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'pending')}
            >
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Rack por defecto</span>
            <select className="input-field w-full" value={rack} onChange={(e) => setRack(e.target.value)}>
              <option value="">Sin rack predeterminado</option>
              {(lookups?.racks ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium">Observaciones</span>
            <textarea
              className="input-field w-full min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-slate-200/60 p-3 md:grid-cols-12 dark:border-slate-700/60"
              >
                <label className="md:col-span-4 space-y-1 text-sm">
                  <span>Producto</span>
                  <select
                    className="input-field w-full"
                    required={index === 0}
                    value={item.product}
                    onChange={(e) => updateItem(index, { product: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {(lookups?.products ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Cantidad</span>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    className="input-field w-full"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  />
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Precio unit.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="input-field w-full"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                  />
                </label>
                <label className="md:col-span-2 space-y-1 text-sm">
                  <span>Desc. %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    className="input-field w-full"
                    value={item.discount}
                    onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                  />
                </label>
                <div className="md:col-span-2 flex items-end justify-end">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    >
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
            <input
              type="number"
              min="0"
              className="input-field w-full"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Impuestos (IGV)</span>
            <input
              type="number"
              min="0"
              className="input-field w-full"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
            />
          </label>
          <div className="flex flex-col justify-end text-right">
            <div className="text-sm text-slate-500">Subtotal: {subtotal.toFixed(2)}</div>
            <div className="text-xl font-bold">Total: {total.toFixed(2)} PEN</div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/app/ventas">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Crear venta'}
          </Button>
        </div>
      </form>
    </div>
  )
}
