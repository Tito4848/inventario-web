'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { apiGet } from '@/app/(frontend)/_lib/api'

type ListResponse<T> = { docs: T[]; totalDocs: number; totalPages: number; page: number }

type Product = { id: string; code?: string; name: string }
type Rack = { id: string; code?: string; name: string }
type Category = { id: string; name: string }

type MovementRow = {
  id: string
  date: string
  movementType: string
  movementTypeLabel: string
  label: string
  notes: string
  document: string
  productName: string
  productCode: string
  rackName: string
  quantity: number
  quantityBase: number
  totalValue: number
  createdByName: string
}

const MOVEMENT_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Salida' },
  { value: 'adjust_in', label: 'Ajuste (+)' },
  { value: 'adjust_out', label: 'Ajuste (-)' },
]

export function MovementsView() {
  const [products, setProducts] = useState<Product[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<string>('')
  const [rack, setRack] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [movementType, setMovementType] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<MovementRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
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
    if (movementType) sp.set('movementType', movementType)
    if (from) sp.set('from', from)
    if (to) sp.set('to', to)
    sp.set('page', String(page))
    sp.set('limit', '50')
    return `/api/inventory/movements?${sp.toString()}`
  }, [product, rack, category, movementType, from, to, page])

  async function refresh() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiGet<ListResponse<MovementRow>>(query)
      setRows(res.docs)
      setTotalPages(res.totalPages || 1)
      setTotalDocs(res.totalDocs || 0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar movimientos.')
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
        <div style={{ flex: 2, minWidth: 200 }}>
          <label className="label">Producto</label>
          <select className="select" value={product} onChange={(e) => { setProduct(e.target.value); setPage(1) }}>
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
          <select className="select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="label">Tipo</label>
          <select className="select" value={movementType} onChange={(e) => { setMovementType(e.target.value); setPage(1) }}>
            {MOVEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 2, minWidth: 200 }}>
          <label className="label">Rack</label>
          <select className="select" value={rack} onChange={(e) => { setRack(e.target.value); setPage(1) }}>
            <option value="">Todos</option>
            {racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="label">Desde</label>
          <input className="input" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        </div>

        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="label">Hasta</label>
          <input className="input" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>

        <div style={{ minWidth: 160 }}>
          <button className="btn" type="button" onClick={refresh} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="muted" style={{ marginTop: 12 }}>
          <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 14 }}>
        <span className="pill">{totalDocs} movimiento(s)</span>
        <a className="btn btnPrimary" href="/app/movements/new">
          Nuevo movimiento
        </a>
      </div>

      <div style={{ marginTop: 14 }} className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Rack</th>
              <th>Cantidad</th>
              <th>Cant. base</th>
              <th>Valor</th>
              <th>Documento</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.date).toLocaleString()}</td>
                <td>{m.movementTypeLabel || m.movementType}</td>
                <td>
                  {m.productCode ? `${m.productCode} — ` : ''}
                  {m.productName}
                </td>
                <td>{m.rackName || '—'}</td>
                <td>{Number(m.quantity).toFixed(4)}</td>
                <td>{Number(m.quantityBase).toFixed(4)}</td>
                <td>{Number(m.totalValue).toFixed(2)}</td>
                <td>
                  {m.document}
                  {m.notes ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {m.notes}
                    </div>
                  ) : null}
                </td>
                <td>{m.createdByName || '—'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="muted">
                  Sin movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 8 }}>
          <button className="btn" type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span className="pill">
            Página {page} de {totalPages}
          </span>
          <button
            className="btn"
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
