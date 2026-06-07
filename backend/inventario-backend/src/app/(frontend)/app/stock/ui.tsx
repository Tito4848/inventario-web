'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { apiGet } from '@/app/(frontend)/_lib/api'

type ListResponse<T> = { docs: T[]; totalDocs: number }

type Product = { id: string; code?: string; name: string }
type Rack = { id: string; code?: string; name: string }

type StockLevel = {
  id: string
  product: unknown
  rack: unknown
  quantityBase: number
  value: number
  isBelowMin?: boolean
  minStockBase?: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function StockView() {
  const [products, setProducts] = useState<Product[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [product, setProduct] = useState<string>('')
  const [rack, setRack] = useState<string>('')
  const [belowMin, setBelowMin] = useState<boolean>(false)
  const [rows, setRows] = useState<StockLevel[]>([])
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
    const sp = new URLSearchParams()
    if (product) sp.set('product', product)
    if (rack) sp.set('rack', rack)
    if (belowMin) sp.set('belowMin', 'true')
    const q = sp.toString()
    return q ? `/api/inventory/stock?${q}` : '/api/inventory/stock'
  }, [product, rack, belowMin])

  async function refresh() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiGet<ListResponse<StockLevel>>(query)
      setRows(res.docs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el stock.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 240 }}>
          <label className="label">Producto</label>
          <select className="select" value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">Todos</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `${p.code} — ` : ''}
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2, minWidth: 240 }}>
          <label className="label">Rack</label>
          <select className="select" value={rack} onChange={(e) => setRack(e.target.value)}>
            <option value="">Todos</option>
            {racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Filtros</label>
          <div className="row">
            <label className="pill" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={belowMin}
                onChange={(e) => setBelowMin(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Bajo mínimo
            </label>
            <button className="btn" type="button" onClick={refresh} disabled={loading}>
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
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
              <th>Producto</th>
              <th>Rack</th>
              <th>Cantidad (base)</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Valor (aprox.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const qty = Number(r.quantityBase ?? 0)
              const product = asRecord(r.product)
              const rackRec = asRecord(r.rack)
              const minFromProduct =
                product && typeof product.minStockBase === 'number'
                  ? product.minStockBase
                  : Number(product?.minStockBase ?? 0)
              const min = Number(r.minStockBase ?? minFromProduct ?? 0)
              const warn = qty < min
              return (
                <tr key={r.id}>
                  <td>{String(product?.name ?? r.product ?? '')}</td>
                  <td>{String(rackRec?.name ?? r.rack ?? '')}</td>
                  <td>{qty.toFixed(4)}</td>
                  <td>{min.toFixed(4)}</td>
                  <td>
                    {warn ? (
                      <span className="badgeWarn">Bajo mínimo</span>
                    ) : (
                      <span className="badgeOk">OK</span>
                    )}
                  </td>
                  <td>{Number(r.value ?? 0).toFixed(2)}</td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

