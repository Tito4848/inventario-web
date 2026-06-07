'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { apiGet } from '@/app/(frontend)/_lib/api'

type ListResponse<T> = { docs: T[]; totalDocs: number }

type Product = { id: string; code?: string; name: string }
type Rack = { id: string; code?: string; name: string }

type KardexRow = {
  id: string
  date: string
  movementType: string
  label: string
  quantityBase: number
  totalValue: number
  inQty: number
  outQty: number
  balanceQty: number
  inValue: number
  outValue: number
  balanceValue: number
  rack?: unknown
}

export function KardexView() {
  const [products, setProducts] = useState<Product[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [product, setProduct] = useState<string>('')
  const [rack, setRack] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [rows, setRows] = useState<KardexRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [p, r] = await Promise.all([
          apiGet<ListResponse<Product>>('/api/products?limit=200&depth=0'),
          apiGet<ListResponse<Rack>>('/api/racks?limit=200&depth=0'),
        ])
        setProducts(p.docs)
        setRacks(r.docs)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar catálogos.')
      }
    })()
  }, [])

  const query = useMemo(() => {
    if (!product) return ''
    const sp = new URLSearchParams()
    sp.set('product', product)
    if (rack) sp.set('rack', rack)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    return `/api/inventory/kardex?${sp.toString()}`
  }, [product, rack, from, to])

  async function run() {
    if (!query) return
    setError(null)
    setLoading(true)
    try {
      const res = await apiGet<ListResponse<KardexRow>>(query)
      setRows(res.docs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el kardex.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 240 }}>
          <label className="label">Producto</label>
          <select className="select" value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">Seleccionar…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} — ` : ''}
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2, minWidth: 240 }}>
          <label className="label">Rack (opcional)</label>
          <select className="select" value={rack} onChange={(e) => setRack(e.target.value)} disabled={!product}>
            <option value="">Todos</option>
            {racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 190 }}>
          <label className="label">Desde</label>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={!product} />
        </div>

        <div style={{ flex: 1, minWidth: 190 }}>
          <label className="label">Hasta</label>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={!product} />
        </div>

        <div style={{ minWidth: 160 }}>
          <button className="btn btnPrimary" type="button" onClick={run} disabled={!product || loading}>
            {loading ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="muted" style={{ marginTop: 12 }}>
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      <div style={{ marginTop: 14 }} className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Entrada (qty)</th>
              <th>Salida (qty)</th>
              <th>Saldo (qty)</th>
              <th>Entrada (S/.)</th>
              <th>Salida (S/.)</th>
              <th>Saldo (S/.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.date).toLocaleString()}</td>
                <td>{m.movementType}</td>
                <td>{m.label}</td>
                <td>{Number(m.inQty ?? 0).toFixed(4)}</td>
                <td>{Number(m.outQty ?? 0).toFixed(4)}</td>
                <td>{Number(m.balanceQty ?? 0).toFixed(4)}</td>
                <td>{Number(m.inValue ?? 0).toFixed(2)}</td>
                <td>{Number(m.outValue ?? 0).toFixed(2)}</td>
                <td>{Number(m.balanceValue ?? 0).toFixed(2)}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="muted">
                  {product ? 'Sin movimientos para el filtro actual.' : 'Selecciona un producto para consultar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

