'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { apiGet } from '../../_lib/api'

type SaleRow = {
  id: string
  orderNumber: string
  customerName?: string
  statusLabel: string
  saleDate: string
  total: number
}

type ListResponse = {
  docs: SaleRow[]
  totalDocs: number
  page: number
  totalPages: number
}

type StatsResponse = {
  dailyCount: number
  monthlyCount: number
  dailyRevenue: number
  monthlyRevenue: number
  pendingOrders: number
  confirmedOrders: number
  deliveredOrders: number
  cancelledOrders: number
}

export function VentasUI() {
  const [rows, setRows] = useState<SaleRow[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
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
        const [list, statsRes] = await Promise.all([
          apiGet<ListResponse>(`/api/sales?${params}`),
          apiGet<StatsResponse>('/api/sales/stats').catch(() => null),
        ])
        if (mounted) {
          setRows(list.docs)
          setStats(statsRes)
        }
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
          <h1 style={{ margin: 0 }}>Ventas</h1>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            Órdenes de venta conectadas al backend
          </p>
        </div>
        <Link className="btn btnPrimary" href="/app/ventas/nueva">
          Nueva venta
        </Link>
      </div>

      {stats && (
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 140 }}>
            <div className="muted" style={{ fontSize: 12 }}>Hoy</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.dailyCount}</div>
            <div>S/ {stats.dailyRevenue.toFixed(2)}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 140 }}>
            <div className="muted" style={{ fontSize: 12 }}>Mes</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.monthlyCount}</div>
            <div>S/ {stats.monthlyRevenue.toFixed(2)}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 140 }}>
            <div className="muted" style={{ fontSize: 12 }}>Pendientes</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.pendingOrders}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 140 }}>
            <div className="muted" style={{ fontSize: 12 }}>Entregadas</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.deliveredOrders}</div>
          </div>
        </div>
      )}

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
          <option value="confirmed">Confirmada</option>
          <option value="delivered">Entregada</option>
          <option value="cancelled">Cancelada</option>
          <option value="returned">Devuelta</option>
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
                <th>Cliente</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/app/ventas/${row.id}`}>{row.orderNumber}</Link>
                  </td>
                  <td>{new Date(row.saleDate).toLocaleDateString()}</td>
                  <td>{row.customerName}</td>
                  <td>{row.statusLabel}</td>
                  <td>S/ {row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="muted" style={{ padding: 12 }}>Sin ventas</p>}
        </div>
      )}
    </div>
  )
}
