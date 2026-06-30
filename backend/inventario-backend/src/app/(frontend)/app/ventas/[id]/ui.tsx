'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../../_lib/api'

type SaleItem = {
  productName?: string
  productCode?: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

type SaleDoc = {
  id: string
  orderNumber: string
  customerName?: string
  status: string
  statusLabel: string
  saleDate: string
  confirmedAt?: string | null
  deliveredAt?: string | null
  subtotal: number
  tax: number
  discountAmount: number
  total: number
  notes?: string | null
  createdByName?: string
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export function VentaDetalleUI({ id }: { id: string }) {
  const [order, setOrder] = useState<SaleDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await apiGet<{ doc: SaleDoc }>(`/api/sales/${id}`)
      setOrder(res.doc)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function runAction(path: string) {
    setActionLoading(true)
    try {
      await apiPost(`/api/sales/${id}/${path}`, {})
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <p className="muted">Cargando...</p>
  if (error || !order) return <p style={{ color: 'var(--danger)' }}>{error ?? 'No encontrada'}</p>

  return (
    <div className="stack" style={{ gap: 16, maxWidth: 960 }}>
      <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/app/ventas">← Volver</Link>
        <h1 style={{ margin: 0 }}>{order.orderNumber}</h1>
        <span className="muted">{order.statusLabel}</span>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {(order.status === 'draft' || order.status === 'pending') && (
          <button type="button" className="btn btnPrimary" disabled={actionLoading} onClick={() => runAction('confirm')}>
            Confirmar
          </button>
        )}
        {order.status === 'confirmed' && (
          <button type="button" className="btn btnPrimary" disabled={actionLoading} onClick={() => runAction('deliver')}>
            Entregar
          </button>
        )}
        {(order.status === 'draft' || order.status === 'pending' || order.status === 'confirmed') && (
          <button type="button" className="btn" disabled={actionLoading} onClick={() => runAction('cancel')}>
            Cancelar
          </button>
        )}
        {order.status === 'delivered' && (
          <button type="button" className="btn" disabled={actionLoading} onClick={() => runAction('return')}>
            Devolver
          </button>
        )}
      </div>

      <div className="card stack" style={{ gap: 8 }}>
        <div>Cliente: {order.customerName}</div>
        <div>Usuario: {order.createdByName ?? '-'}</div>
        <div>Fecha: {new Date(order.saleDate).toLocaleString()}</div>
        {order.notes && <div>Notas: {order.notes}</div>}
        <div>Subtotal: S/ {order.subtotal.toFixed(2)}</div>
        <div>Descuento: S/ {order.discountAmount.toFixed(2)}</div>
        <div>Impuestos: S/ {order.tax.toFixed(2)}</div>
        <div><strong>Total: S/ {order.total.toFixed(2)}</strong></div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Desc %</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td>{item.productCode ? `${item.productCode} — ` : ''}{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice.toFixed(2)}</td>
                <td>{item.discount.toFixed(2)}</td>
                <td>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card stack" style={{ gap: 6 }}>
        <h3 style={{ margin: 0 }}>Historial</h3>
        <div>Creada: {new Date(order.createdAt).toLocaleString()}</div>
        {order.confirmedAt && <div>Confirmada: {new Date(order.confirmedAt).toLocaleString()}</div>}
        {order.deliveredAt && <div>Entregada: {new Date(order.deliveredAt).toLocaleString()}</div>}
        {order.status === 'cancelled' && <div>Cancelada: {new Date(order.updatedAt).toLocaleString()}</div>}
        {order.status === 'returned' && <div>Devuelta: {new Date(order.updatedAt).toLocaleString()}</div>}
      </div>
    </div>
  )
}
