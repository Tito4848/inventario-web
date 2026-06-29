'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { apiGet } from '@/app/(frontend)/_lib/api'

type ListResponse<T> = { docs: T[]; totalDocs: number }

type Product = { id: string; code?: string; name: string }
type Rack = { id: string; code?: string; name: string }
type Category = { id: string; name: string }

type StockStatus = 'out' | 'low' | 'ok' | 'over_max'

type StockLevel = {
  id: string
  product: unknown
  rack: unknown
  quantityBase: number
  availableQtyBase: number
  reservedQtyBase: number
  value: number
  isBelowMin?: boolean
  isOutOfStock?: boolean
  minStockBase?: number
  maxStockBase?: number | null
  stockStatus?: StockStatus
}

const STATUS_LABELS: Record<StockStatus, string> = {
  out: 'Agotado',
  low: 'Stock bajo',
  ok: 'OK',
  over_max: 'Sobre máximo',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === 'out') return <span className="badgeWarn">Agotado</span>
  if (status === 'low') return <span className="badgeWarn">Bajo mínimo</span>
  if (status === 'over_max') return <span className="pill">Sobre máximo</span>
  return <span className="badgeOk">OK</span>
}

export function StockView() {
  const [products, setProducts] = useState<Product[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<string>('')
  const [rack, setRack] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [belowMin, setBelowMin] = useState<boolean>(false)
  const [outOfStock, setOutOfStock] = useState<boolean>(false)
  const [aggregate, setAggregate] = useState<boolean>(true)
  const [rows, setRows] = useState<StockLevel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [p, r, c] = await Promise.all([
          apiGet<ListResponse<Product>>('/api/products?limit=200&depth=0'),
          apiGet<ListResponse<Rack>>('/api/racks?limit=200&depth=0'),
          apiGet<ListResponse<Category>>('/api/categories?limit=200&depth=0'),
        ])
        setProducts(p.docs)
        setRacks(r.docs)
        setCategories(c.docs)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar catálogos.')
      }
    })()
  }, [])

  const query = useMemo(() => {
    const sp = new URLSearchParams()
    if (product) sp.set('product', product)
    if (rack) sp.set('rack', rack)
    if (category) sp.set('category', category)
    if (belowMin) sp.set('belowMin', 'true')
    if (outOfStock) sp.set('outOfStock', 'true')
    if (aggregate) sp.set('aggregate', 'product')
    const q = sp.toString()
    return q ? `/api/inventory/stock?${q}` : '/api/inventory/stock?aggregate=product'
  }, [product, rack, category, belowMin, outOfStock, aggregate])

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

  const alertCount = rows.filter((r) => r.stockStatus === 'out' || r.stockStatus === 'low').length

  return (
    <div>
      {alertCount > 0 && (
        <div className="card" style={{ marginBottom: 14, background: 'var(--panel-2)', boxShadow: 'none' }}>
          <div className="cardBody">
            <span className="badgeWarn">{alertCount} producto(s) con alerta de stock</span>
          </div>
        </div>
      )}

      <div className="row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 2, minWidth: 200 }}>
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

        <div style={{ flex: 2, minWidth: 200 }}>
          <label className="label">Categoría</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2, minWidth: 200 }}>
          <label className="label">Rack</label>
          <select
            className="select"
            value={rack}
            onChange={(e) => setRack(e.target.value)}
            disabled={aggregate}
          >
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
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            <label className="pill" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={aggregate}
                onChange={(e) => setAggregate(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Por producto
            </label>
            <label className="pill" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={belowMin}
                onChange={(e) => setBelowMin(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Bajo mínimo
            </label>
            <label className="pill" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={outOfStock}
                onChange={(e) => setOutOfStock(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Agotados
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
              {!aggregate && <th>Rack</th>}
              <th>Stock actual</th>
              <th>Disponible</th>
              <th>Reservado</th>
              <th>Mínimo</th>
              <th>Máximo</th>
              <th>Estado</th>
              <th>Valor (aprox.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const qty = Number(r.quantityBase ?? 0)
              const productRec = asRecord(r.product)
              const rackRec = asRecord(r.rack)
              const minFromProduct =
                productRec && typeof productRec.minStockBase === 'number'
                  ? productRec.minStockBase
                  : Number(productRec?.minStockBase ?? 0)
              const maxFromProduct =
                productRec?.maxStockBase != null ? Number(productRec.maxStockBase) : null
              const min = Number(r.minStockBase ?? minFromProduct ?? 0)
              const max = r.maxStockBase ?? maxFromProduct
              const status = (r.stockStatus ?? 'ok') as StockStatus

              return (
                <tr key={r.id}>
                  <td>{String(productRec?.name ?? r.product ?? '')}</td>
                  {!aggregate && <td>{String(rackRec?.name ?? r.rack ?? '')}</td>}
                  <td>{qty.toFixed(4)}</td>
                  <td>{Number(r.availableQtyBase ?? qty).toFixed(4)}</td>
                  <td>{Number(r.reservedQtyBase ?? 0).toFixed(4)}</td>
                  <td>{min.toFixed(4)}</td>
                  <td>{max != null ? max.toFixed(4) : '—'}</td>
                  <td>
                    <StatusBadge status={status} />
                    <span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td>{Number(r.value ?? 0).toFixed(2)}</td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td colSpan={aggregate ? 8 : 9} className="muted">
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
