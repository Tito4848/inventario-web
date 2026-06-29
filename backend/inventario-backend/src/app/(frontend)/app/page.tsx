import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canReadInventoryData, getDefaultAppRoute } from '@/access/permissions'
import type { User } from '@/payload-types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

export default async function DashboardPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User

  if (!canReadInventoryData(u)) {
    redirect(getDefaultAppRoute(u))
  }

  const todayStart = startOfDay().toISOString()
  const todayEnd = endOfDay().toISOString()

  const [products, movements, levels, todayEntries, todayExits] = await Promise.all([
    payload.find({ collection: 'products', limit: 0, user: u, overrideAccess: false }),
    payload.find({
      collection: 'stock-movements',
      limit: 5,
      sort: '-date',
      depth: 2,
      user: u,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'stock-levels',
      limit: 500,
      depth: 2,
      user: u,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'stock-movements',
      limit: 0,
      user: u,
      overrideAccess: false,
      where: {
        and: [
          { date: { greater_than_equal: todayStart } },
          { date: { less_than_equal: todayEnd } },
          { movementType: { in: ['in', 'adjust_in'] } },
        ],
      },
    }),
    payload.find({
      collection: 'stock-movements',
      limit: 0,
      user: u,
      overrideAccess: false,
      where: {
        and: [
          { date: { greater_than_equal: todayStart } },
          { date: { less_than_equal: todayEnd } },
          { movementType: { in: ['out', 'adjust_out'] } },
        ],
      },
    }),
  ])

  const productAgg = new Map<string, { qty: number; min: number }>()

  for (const level of levels.docs as unknown[]) {
    const lr = asRecord(level)
    if (!lr) continue
    const productRec = asRecord(lr.product)
    const productId = productRec?.id ? String(productRec.id) : String(lr.product ?? '')
    if (!productId) continue
    const qty = num(lr.quantityBase, 0)
    const min = productRec ? num(productRec.minStockBase, 0) : 0
    const existing = productAgg.get(productId)
    if (existing) {
      existing.qty += qty
    } else {
      productAgg.set(productId, { qty, min })
    }
  }

  let lowCount = 0
  let outCount = 0
  for (const { qty, min } of productAgg.values()) {
    if (qty <= 0) outCount++
    else if (qty <= min) lowCount++
  }

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Resumen inventario</div>
            <span className="pill">Hoy</span>
          </div>
          <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
            Indicadores rápidos para operar el inventario.
          </p>
        </div>
        <div className="cardBody">
          <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Productos</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{products.totalDocs}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Stock bajo</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2, color: 'var(--warn)' }}>{lowCount}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Agotados</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2, color: 'var(--danger)' }}>{outCount}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Movimientos</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{movements.totalDocs}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Entradas hoy</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{todayEntries.totalDocs}</div>
              </div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Salidas hoy</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{todayExits.totalDocs}</div>
              </div>
            </div>
          </div>

          {(lowCount > 0 || outCount > 0) && (
            <div style={{ marginTop: 14 }}>
              <span className="badgeWarn">
                {outCount > 0 && `${outCount} producto(s) agotado(s)`}
                {outCount > 0 && lowCount > 0 && ' · '}
                {lowCount > 0 && `${lowCount} producto(s) con stock bajo`}
              </span>
            </div>
          )}

          <div style={{ marginTop: 14 }} className="row">
            <a className="btn btnPrimary" href="/app/movements/new">
              Registrar movimiento
            </a>
            <a className="btn" href="/app/movements">
              Historial
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
                  const productRec = asRecord(mr.product)
                  const rackRec = asRecord(mr.rack)
                  return (
                    <tr key={String(mr.id ?? '')}>
                      <td>{new Date(String(mr.date)).toLocaleString()}</td>
                      <td>{String(mr.movementType)}</td>
                      <td>{String(productRec?.name ?? mr.product ?? '')}</td>
                      <td>{String(rackRec?.name ?? mr.rack ?? '')}</td>
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
