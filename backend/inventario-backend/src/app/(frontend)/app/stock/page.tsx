import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, getDefaultAppRoute } from '@/access/permissions'
import type { User } from '@/payload-types'

import { StockView } from './ui'

export default async function StockPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User
  if (!canAccessModule(u, 'stock')) redirect(getDefaultAppRoute(u))

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Stock</div>
          <span className="pill">Tiempo real</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Consulta por producto y ubicación. Puedes filtrar por stock bajo mínimo.
        </p>
      </div>
      <div className="cardBody">
        <StockView />
      </div>
    </div>
  )
}
