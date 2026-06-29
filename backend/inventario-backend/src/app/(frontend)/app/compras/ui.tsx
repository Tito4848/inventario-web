'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiGet } from '../../_lib/api'

type PurchaseRow = {
  id: string
  orderNumber: string
  supplierName?: string
  statusLabel: string
  orderDate: string
  total: number
  currency: string
}

type ListResponse = {
  docs: PurchaseRow[]
  totalDocs: number
  page: number
  totalPages: number
}

export function ComprasUI() {
  const [rows, setRows] = useState<PurchaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ limit: '50', page: '1' })
        if (search) params.set('search', search)
        if (status) params.set('status', status)
        const data = await apiGet<ListResponse>(`/api/purchases?${params}`)
        if (mounted) setRows(data.docs)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [search, status])

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Compras</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Órdenes de compra conectadas a inventario y kardex
          </p>
        </div>
        <Link className="btn btnPrimary" href="/app/compras/nueva">
          Nueva compra
        </Link>
      </div>

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar N° orden"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="draft">Borrador</option>
          <option value="pending">Pendiente</option>
          <option value="partial">Parcial</option>
          <option value="received">Recibida</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      {loading && <p className="muted">Cargando...</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {!loading && !error && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/app/compras/${row.id}`}>{row.orderNumber}</Link>
                  </td>
                  <td>{new Date(row.orderDate).toLocaleDateString()}</td>
                  <td>{row.supplierName}</td>
                  <td>{row.statusLabel}</td>
                  <td>
                    {row.total.toFixed(2)} {row.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="muted" style={{ padding: 12 }}>Sin órdenes</p>}
        </div>
      )}
    </div>
  )
}
