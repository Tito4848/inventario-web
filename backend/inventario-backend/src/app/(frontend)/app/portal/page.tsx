import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, getPrimaryRole, getRoleLabel } from '@/access/permissions'
import type { User } from '@/payload-types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export default async function ClientPortalPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User

  if (!canAccessModule(u, 'portal') && canAccessModule(u, 'dashboard')) {
    redirect('/app')
  }

  const orders = await payload.find({
    collection: 'sales-orders',
    limit: 20,
    sort: '-saleDate',
    depth: 1,
    user: u,
    overrideAccess: false,
  })

  const role = getPrimaryRole(u)

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div style={{ fontWeight: 800, fontSize: 18 }}>Mi portal</div>
          <span className="pill">{getRoleLabel(role)}</span>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Bienvenido{u.fullName ? `, ${u.fullName}` : ''}. Aquí ves únicamente tus operaciones.
          </p>
          <div className="row" style={{ gap: 14, marginTop: 14 }}>
            <div className="card" style={{ flex: 1, background: 'var(--panel-2)', boxShadow: 'none' }}>
              <div className="cardBody">
                <div className="muted">Mis pedidos</div>
                <div style={{ fontSize: 30, fontWeight: 900, marginTop: 2 }}>{orders.totalDocs}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div style={{ fontWeight: 800, fontSize: 18 }}>Mis operaciones recientes</div>
        </div>
        <div className="cardBody">
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>N° Venta</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(orders.docs as unknown[]).map((o) => {
                  const row = asRecord(o) || {}
                  return (
                    <tr key={String(row.id ?? '')}>
                      <td>{String(row.orderNumber ?? '')}</td>
                      <td>{row.saleDate ? new Date(String(row.saleDate)).toLocaleDateString() : '-'}</td>
                      <td>{String(row.status ?? '')}</td>
                      <td>{Number(row.total ?? 0).toFixed(2)}</td>
                    </tr>
                  )
                })}
                {!orders.docs.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      Aún no tienes operaciones registradas.
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
