import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, getDefaultAppRoute } from '@/access/permissions'
import type { User } from '@/payload-types'

import { KardexView } from './ui'

export default async function KardexPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User
  if (!canAccessModule(u, 'kardex')) redirect(getDefaultAppRoute(u))

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Kardex valorizado (FIFO)</div>
          <span className="pill">FIFO</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Selecciona un producto y consulta sus entradas/salidas con valorización FIFO.
        </p>
      </div>
      <div className="cardBody">
        <KardexView />
      </div>
    </div>
  )
}
