import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, getDefaultAppRoute } from '@/access/permissions'
import type { User } from '@/payload-types'

import { MovementForm } from './ui'

export default async function NewMovementPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User
  if (!canAccessModule(u, 'movements')) redirect(getDefaultAppRoute(u))

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Registrar movimiento</div>
          <span className="pill">Entrada / Salida / Ajuste</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Al guardar se actualiza el stock en tiempo real y las salidas se valorizan con FIFO.
        </p>
      </div>
      <div className="cardBody">
        <MovementForm />
      </div>
    </div>
  )
}
