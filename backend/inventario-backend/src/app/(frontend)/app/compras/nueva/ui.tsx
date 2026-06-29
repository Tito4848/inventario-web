'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../../_lib/api'

type Lookup = { id: string; label: string; purchasePrice?: number }

export function CompraFormUI() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Lookup[]>([])
  const [products, setProducts] = useState<Lookup[]>([])
  const [supplier, setSupplier] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [items, setItems] = useState<Array<{ product: string; quantity: number; unitCost: number; discount: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [sup, prods] = await Promise.all([
        apiGet<{ docs: Array<{ id: string; businessName?: string; name?: string }> }>('/api/suppliers?limit=200&depth=0'),
        apiGet<{ docs: Array<{ id: string; name: string; code?: string; purchasePrice?: number }> }>('/api/products?limit=500&depth=0'),
      ])
      setSuppliers(sup.docs.map((s) => ({ id: String(s.id), label: s.businessName || s.name || String(s.id) })))
      setProducts(
        prods.docs.map((p) => ({
          id: String(p.id),
          label: p.code ? `${p.code} — ${p.name}` : p.name,
          purchasePrice: p.purchasePrice ?? 0,
        })),
      )
    })().catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [])

  function addItem() {
    if (!product) return
    setItems((prev) => [...prev, { product, quantity, unitCost, discount: 0 }])
    setProduct('')
    setQuantity(1)
    setUnitCost(0)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ doc: { id: string } }>('/api/purchases', {
        supplier,
        orderDate: new Date(orderDate).toISOString(),
        status: 'pending',
        currency: 'PEN',
        tax: 0,
        discount: 0,
        items,
      })
      router.push(`/app/compras/${res.doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="stack" style={{ gap: 16, maxWidth: 900 }} onSubmit={submit}>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Link href="/app/compras">← Volver</Link>
        <h1 style={{ margin: 0 }}>Nueva compra</h1>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div className="card stack" style={{ gap: 12 }}>
        <label className="stack" style={{ gap: 4 }}>
          Proveedor
          <select className="input" required value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">Seleccionar</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Fecha
          <input className="input" type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </label>
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Agregar producto</h3>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <select
            className="input"
            value={product}
            onChange={(e) => {
              const id = e.target.value
              setProduct(id)
              const p = products.find((x) => x.id === id)
              if (p) setUnitCost(p.purchasePrice ?? 0)
            }}
          >
            <option value="">Producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input className="input" type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <input className="input" type="number" min="0" step="any" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
          <button type="button" className="btn" onClick={addItem}>Agregar</button>
        </div>
        <ul>
          {items.map((item, i) => {
            const label = products.find((p) => p.id === item.product)?.label ?? item.product
            return <li key={i}>{label} — {item.quantity} x {item.unitCost}</li>
          })}
        </ul>
      </div>
      <button className="btn btnPrimary" type="submit" disabled={saving || !items.length}>
        {saving ? 'Guardando...' : 'Crear orden'}
      </button>
    </form>
  )
}
