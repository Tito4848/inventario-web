'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { apiGet, apiPost } from '../../../_lib/api'

type Lookup = { id: string; label: string; salePrice?: number }

export function VentaFormUI() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Lookup[]>([])
  const [products, setProducts] = useState<Lookup[]>([])
  const [customer, setCustomer] = useState('')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10))
  const [product, setProduct] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [items, setItems] = useState<Array<{ product: string; quantity: number; unitPrice: number; discount: number }>>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [cust, prods] = await Promise.all([
        apiGet<{ docs: Array<{ id: string; businessName?: string; name?: string }> }>('/api/customers?limit=200&depth=0'),
        apiGet<{ docs: Array<{ id: string; name: string; code?: string; salePrice?: number }> }>('/api/products?limit=500&depth=0'),
      ])
      setCustomers(cust.docs.map((c) => ({ id: String(c.id), label: c.businessName || c.name || String(c.id) })))
      setProducts(
        prods.docs.map((p) => ({
          id: String(p.id),
          label: p.code ? `${p.code} — ${p.name}` : p.name,
          salePrice: p.salePrice ?? 0,
        })),
      )
    })().catch((err) => setError(err instanceof Error ? err.message : 'Error'))
  }, [])

  function addItem() {
    if (!product) return
    setItems((prev) => [...prev, { product, quantity, unitPrice, discount }])
    setProduct('')
    setQuantity(1)
    setUnitPrice(0)
    setDiscount(0)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await apiPost<{ doc: { id: string } }>('/api/sales', {
        customer,
        saleDate: new Date(saleDate).toISOString(),
        status: 'pending',
        tax,
        discountAmount,
        items,
      })
      router.push(`/app/ventas/${res.doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="stack" style={{ gap: 16, maxWidth: 900 }} onSubmit={submit}>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Link href="/app/ventas">← Volver</Link>
        <h1 style={{ margin: 0 }}>Nueva venta</h1>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div className="card stack" style={{ gap: 12 }}>
        <label className="stack" style={{ gap: 4 }}>
          Cliente
          <select className="input" required value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">Seleccionar</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Fecha
          <input className="input" type="date" required value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Descuento orden
          <input className="input" type="number" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Impuestos
          <input className="input" type="number" min="0" value={tax} onChange={(e) => setTax(Number(e.target.value))} />
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
              if (p) setUnitPrice(p.salePrice ?? 0)
            }}
          >
            <option value="">Producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <input className="input" type="number" min="0.0001" step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <input className="input" type="number" min="0" step="any" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
          <input className="input" type="number" min="0" max="100" step="any" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="Desc %" />
          <button type="button" className="btn" onClick={addItem}>Agregar</button>
        </div>
        <ul>
          {items.map((item, i) => {
            const label = products.find((p) => p.id === item.product)?.label ?? item.product
            return <li key={i}>{label} — {item.quantity} x {item.unitPrice} ({item.discount}% desc)</li>
          })}
        </ul>
      </div>
      <button className="btn btnPrimary" type="submit" disabled={saving || !items.length}>
        {saving ? 'Guardando...' : 'Crear venta'}
      </button>
    </form>
  )
}
