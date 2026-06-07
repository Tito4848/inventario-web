import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const [products, movements, levels] = await Promise.all([
    payload.find({ collection: 'products', limit: 0, user, overrideAccess: false }),
    payload.find({
      collection: 'stock-movements',
      limit: 5,
      sort: '-date',
      depth: 2,
      user,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'stock-levels',
      limit: 200,
      depth: 2,
      user,
      overrideAccess: false,
    }),
  ])

  const lowCount = (levels.docs as unknown[]).filter((l) => {
    const lr = asRecord(l)
    if (!lr) return false
    const qty = num(lr.quantityBase, 0)
    const pr = asRecord(lr.product)
    const min = pr ? num(pr.minStockBase, 0) : 0
    return qty < min
  }).length

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Resumen</div>
            <span className="pill">Hoy</span>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Indicadores rápidos para operar el inventario.
          </p>
        </div>
        <div className="cardBody">
          <div className="row" style={{ gap: 14 }}>
            <div className="card" style={{ flex: 1, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Productos</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{products.totalDocs}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Stock bajo mínimo</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{lowCount}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }} className="row">
            <a className="btn btnPrimary" href="/app/movements/new">
              Registrar movimiento
            </a>
            <a className="btn" href="/app/stock">
              Ver stock
            </a>
            <a className="btn" href="/app/kardex">
              Kardex FIFO
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Últimos movimientos</div>
            <span className="pill">{movements.totalDocs} total</span>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Entradas/salidas recientes (valorizadas).
          </p>
        </div>
        <div className="cardBody">
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Rack</th>
                  <th>Cant. base</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {(movements.docs as unknown[]).map((m) => {
                  const mr = asRecord(m) || {}
                  const product = asRecord(mr.product)
                  const rack = asRecord(mr.rack)
                  return (
                  <tr key={String(mr.id ?? '')}>
                    <td>{new Date(String(mr.date)).toLocaleString()}</td>
                    <td>{String(mr.movementType)}</td>
                    <td>{String(product?.name ?? mr.product ?? '')}</td>
                    <td>{String(rack?.name ?? mr.rack ?? '')}</td>
                    <td>{num(mr.quantityBase, 0).toFixed(4)}</td>
                    <td>{num(mr.totalValue, 0).toFixed(2)}</td>
                  </tr>
                  )
                })}
                {!movements.docs.length && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Aún no hay movimientos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

