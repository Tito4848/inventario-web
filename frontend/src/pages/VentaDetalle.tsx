import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle,
  Edit,
  RotateCcw,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { useNotifications } from '../lib/notifications'
import { getDefaultRoute, resolveSalesPermissions } from '../lib/permissions'
import {
  cancelSale,
  deleteSale,
  fetchSale,
  fetchSaleLookups,
  formatSaleDate,
  formatSaleMoney,
  previewSaleTotals,
  saleStatusClass,
  updateSale,
  type SaleFormData,
} from '../lib/salesApi'

type LineItem = {
  product: string
  quantity: number
  unitPrice: number
  discount: number
}

function buildTimeline(order: {
  status: string
  createdAt: string
  confirmedAt?: string | null
  deliveredAt?: string | null
  updatedAt: string
}) {
  const events: Array<{ label: string; date: string; color: string }> = [
    { label: 'Creada', date: order.createdAt, color: 'bg-slate-400' },
  ]
  if (order.confirmedAt) {
    events.push({ label: 'Confirmada', date: order.confirmedAt, color: 'bg-amber-500' })
  }
  if (order.deliveredAt) {
    events.push({ label: 'Entregada', date: order.deliveredAt, color: 'bg-emerald-500' })
  }
  if (order.status === 'cancelled') {
    events.push({ label: 'Cancelada', date: order.updatedAt, color: 'bg-red-500' })
  }
  if (order.status === 'returned') {
    events.push({ label: 'Devuelta', date: order.updatedAt, color: 'bg-purple-500' })
  }
  return events
}

export default function VentaDetalle() {
  const { id = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permissions, user } = useAuth()
  const navigate = useNavigate()
  const { addNotification } = useNotifications()
  const queryClient = useQueryClient()
  const salesPerms = resolveSalesPermissions(user, permissions)

  const editMode = searchParams.get('edit') === '1'
  const canEdit = salesPerms.canUpdateSales

  if (permissions && !salesPerms.canReadSales) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => fetchSale(id),
    enabled: Boolean(id) && salesPerms.canReadSales,
  })

  const { data: lookups } = useQuery({
    queryKey: ['sale-lookups'],
    queryFn: fetchSaleLookups,
    enabled: editMode && canEdit,
  })

  const [customer, setCustomer] = useState('')
  const [saleDate, setSaleDate] = useState('')
  const [tax, setTax] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [rack, setRack] = useState('')
  const [items, setItems] = useState<LineItem[]>([])

  const order = data?.doc
  const isEditable = order && (order.status === 'draft' || order.status === 'pending')

  useEffect(() => {
    if (!order || !editMode) return
    setCustomer(order.customer)
    setSaleDate(order.saleDate.slice(0, 10))
    setTax(order.tax)
    setDiscountAmount(order.discountAmount)
    setNotes(order.notes ?? '')
    setRack(order.rack ?? '')
    setItems(
      order.items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
      })),
    )
  }, [order, editMode])

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<SaleFormData>) => updateSale(id, payload),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Venta actualizada' })
      queryClient.invalidateQueries({ queryKey: ['sale', id] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      setSearchParams({})
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelSale(id),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Venta cancelada' })
      queryClient.invalidateQueries({ queryKey: ['sale', id] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSale(id),
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Ventas', message: 'Venta eliminada' })
      navigate('/app/ventas')
    },
    onError: (err: Error) =>
      addNotification({ type: 'error', title: 'Error', message: err.message }),
  })

  if (isLoading) return <PageSkeleton />
  if (error || !order) return <ErrorState message="No se pudo cargar la venta." onRetry={() => refetch()} />

  const timeline = buildTimeline(order)
  const { subtotal: editSubtotal, total: editTotal } = previewSaleTotals(items, discountAmount, tax)

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    updateMutation.mutate({
      customer,
      saleDate: new Date(saleDate).toISOString(),
      tax,
      discountAmount,
      notes: notes || undefined,
      rack: rack || undefined,
      items: items.filter((i) => i.product),
    })
  }

  if (editMode && canEdit && isEditable) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => setSearchParams({})}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Editar — {order.orderNumber}</h1>
            <p className="text-sm text-slate-500">Modifique los datos de la venta</p>
          </div>
        </div>

        <form onSubmit={handleSaveEdit} className="space-y-6">
          <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Cliente</span>
              <select className="input-field w-full" required value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value="">Seleccionar...</option>
                {(lookups?.customers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Fecha</span>
              <input type="date" className="input-field w-full" required value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium">Observaciones</span>
              <textarea className="input-field w-full min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>

          <div className="glass-card space-y-3 p-5">
            <h2 className="font-semibold">Productos</h2>
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border p-3 md:grid-cols-4">
                <select
                  className="input-field"
                  value={item.product}
                  onChange={(e) => {
                    const product = e.target.value
                    setItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, product } : row)),
                    )
                  }}
                >
                  <option value="">Producto...</option>
                  {(lookups?.products ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.0001"
                  className="input-field"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, quantity: Number(e.target.value) } : row)),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={item.unitPrice}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, unitPrice: Number(e.target.value) } : row)),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={item.discount}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, discount: Number(e.target.value) } : row)),
                    )
                  }
                />
              </div>
            ))}
          </div>

          <div className="glass-card grid gap-4 p-5 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span>Descuento orden</span>
              <input type="number" min="0" className="input-field w-full" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
            </label>
            <label className="space-y-1 text-sm">
              <span>Impuestos</span>
              <input type="number" min="0" className="input-field w-full" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
            </label>
            <div className="text-right">
              <div className="text-sm text-slate-500">Subtotal: {editSubtotal.toFixed(2)}</div>
              <div className="text-xl font-bold">Total: {editTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setSearchParams({})}>Cancelar</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link to="/app/ventas" className="mt-1 text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-sm text-slate-500">
              {order.customerName} ·{' '}
              <span className={saleStatusClass(order.status)}>{order.statusLabel}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && isEditable && (
            <Button variant="outline" onClick={() => setSearchParams({ edit: '1' })}>
              <Edit className="h-4 w-4" /> Editar
            </Button>
          )}
          {salesPerms.canConfirmSales && (order.status === 'draft' || order.status === 'pending') && (
            <Link to={`/app/ventas/${id}/confirmar`}>
              <Button><CheckCircle className="h-4 w-4" /> Confirmar</Button>
            </Link>
          )}
          {salesPerms.canDeliverSales && order.status === 'confirmed' && (
            <Link to={`/app/ventas/${id}/entregar`}>
              <Button><Truck className="h-4 w-4" /> Entregar</Button>
            </Link>
          )}
          {salesPerms.canCancelSales &&
            (order.status === 'draft' || order.status === 'pending' || order.status === 'confirmed') && (
            <Button variant="outline" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              <XCircle className="h-4 w-4" /> Cancelar
            </Button>
          )}
          {salesPerms.canReturnSales && order.status === 'delivered' && (
            <Link to={`/app/ventas/${id}/devolver`}>
              <Button variant="outline"><RotateCcw className="h-4 w-4" /> Devolver</Button>
            </Link>
          )}
          {salesPerms.canDeleteSales &&
            (order.status === 'draft' || order.status === 'pending' || order.status === 'cancelled') && (
            <Button variant="outline" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card space-y-2 p-5 text-sm">
          <div><span className="text-slate-500">Fecha venta:</span> {formatSaleDate(order.saleDate)}</div>
          <div><span className="text-slate-500">Cliente:</span> {order.customerName}</div>
          <div><span className="text-slate-500">Usuario:</span> {order.createdByName || '-'}</div>
          <div><span className="text-slate-500">Rack:</span> {order.rackName || '-'}</div>
          {order.notes && <div><span className="text-slate-500">Observaciones:</span> {order.notes}</div>}
        </div>
        <div className="glass-card space-y-2 p-5 text-sm">
          <div>Subtotal: {formatSaleMoney(order.subtotal)}</div>
          <div>Descuento: {formatSaleMoney(order.discountAmount)}</div>
          <div>Impuestos: {formatSaleMoney(order.tax)}</div>
          <div className="text-lg font-bold">Total: {formatSaleMoney(order.total)}</div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto p-5">
        <h2 className="mb-4 font-semibold">Productos</h2>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Producto</th>
              <th className="py-2">Cantidad</th>
              <th className="py-2">Precio</th>
              <th className="py-2">Desc. %</th>
              <th className="py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id ?? idx} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2">
                  {item.productCode ? `${item.productCode} — ` : ''}
                  {item.productName}
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{item.unitPrice.toFixed(2)}</td>
                <td className="py-2">{item.discount.toFixed(2)}</td>
                <td className="py-2">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-5">
        <h2 className="mb-4 font-semibold">Historial</h2>
        <div className="relative space-y-4 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
          {timeline.map((event, idx) => (
            <div key={idx} className="relative">
              <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ${event.color}`} />
              <div className="font-medium">{event.label}</div>
              <div className="text-sm text-slate-500">{formatSaleDate(event.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
