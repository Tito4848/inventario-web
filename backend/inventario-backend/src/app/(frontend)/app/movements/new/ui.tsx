'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { apiGet, apiPost } from '@/app/(frontend)/_lib/api'

type ListResponse<T> = { docs: T[]; totalDocs: number }

type Unit = { id: string; name: string; abbreviation: string }
type Product = { id: string; code?: string; name: string; baseUnit?: Unit | string; minStockBase?: number }
type Rack = { id: string; code?: string; name: string }

type MovementType = 'in' | 'out' | 'adjust_in' | 'adjust_out'

export function MovementForm() {
  const [products, setProducts] = useState<Product[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [movementType, setMovementType] = useState<MovementType>('in')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [product, setProduct] = useState<string>('')
  const [rack, setRack] = useState<string>('')
  const [unit, setUnit] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('1')
  const [unitCost, setUnitCost] = useState<string>('0')
  const [label, setLabel] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const needsCost = movementType === 'in' || movementType === 'adjust_in'

  useEffect(() => {
    ;(async () => {
      try {
        const [p, r, u] = await Promise.all([
          apiGet<ListResponse<Product>>('/api/products?limit=200&depth=1'),
          apiGet<ListResponse<Rack>>('/api/racks?limit=200&depth=0'),
          apiGet<ListResponse<Unit>>('/api/units?limit=200&depth=0'),
        ])
        setProducts(p.docs)
        setRacks(r.docs)
        setUnits(u.docs)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'No se pudo cargar catálogos.')
      }
    })()
  }, [])

  const selectedProduct = useMemo(() => products.find((p) => p.id === product) || null, [products, product])

  useEffect(() => {
    if (!selectedProduct) return
    const baseUnitId = typeof selectedProduct.baseUnit === 'string' ? selectedProduct.baseUnit : selectedProduct.baseUnit?.id
    if (baseUnitId && !unit) setUnit(baseUnitId)
    if (!label) setLabel(`${movementType.toUpperCase()} — ${selectedProduct.name}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, movementType])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const qty = Number(quantity)
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Cantidad inválida.')
      const cost = Number(unitCost)
      if (needsCost && (!Number.isFinite(cost) || cost < 0)) throw new Error('Costo unitario inválido.')
      if (!product) throw new Error('Selecciona un producto.')
      if (!rack) throw new Error('Selecciona un rack.')
      if (!unit) throw new Error('Selecciona una unidad.')

      await apiPost('/api/stock-movements', {
        label: label || `${movementType.toUpperCase()} — ${selectedProduct?.name || ''}`.trim(),
        movementType,
        date: new Date(date).toISOString(),
        product,
        rack,
        quantity: qty,
        unit,
        unitCost: needsCost ? cost : undefined,
        notes: notes || undefined,
      })

      setSuccess('Movimiento registrado. Stock actualizado.')
      setNotes('')
      setQuantity('1')
      setUnitCost('0')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid2">
        <div>
          <label className="label">Tipo</label>
          <select className="select" value={movementType} onChange={(e) => setMovementType(e.target.value as MovementType)}>
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
            <option value="adjust_in">Ajuste (+)</option>
            <option value="adjust_out">Ajuste (-)</option>
          </select>
        </div>
        <div>
          <label className="label">Fecha</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid2">
        <div>
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
        <div>
          <label className="label">Rack</label>
          <select className="select" value={rack} onChange={(e) => setRack(e.target.value)}>
            <option value="">Seleccionar…</option>
            {racks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code ? `${r.code} — ` : ''}
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid2">
        <div>
          <label className="label">Cantidad</label>
          <input className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="select" value={unit} onChange={(e) => setUnit(e.target.value)} disabled={!product}>
            <option value="">Seleccionar…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.abbreviation} — {u.name}
              </option>
            ))}
          </select>
          <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            Tip: si usas una unidad distinta a la base del producto, debes tener equivalencia configurada.
          </div>
        </div>
      </div>

      {needsCost && (
        <div style={{ maxWidth: 520 }}>
          <label className="label">Costo unitario (según la unidad ingresada)</label>
          <input className="input" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} inputMode="decimal" />
        </div>
      )}

      <label className="label">Descripción</label>
      <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Compra proveedor X" />

      <label className="label">Notas</label>
      <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {(error || success) && (
        <div className="muted" style={{ marginTop: 12 }}>
          {error && <span style={{ color: 'var(--danger)' }}>{error}</span>}
          {success && <span style={{ color: 'var(--accent-2)' }}>{success}</span>}
        </div>
      )}

      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
        <button className="btn btnPrimary" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  )
}

