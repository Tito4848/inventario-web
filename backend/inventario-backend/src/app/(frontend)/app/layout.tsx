import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

import { LogoutButton } from './ui'
import type { User } from '@/payload-types'

export default async function AppLayout(props: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  const u = user as unknown as User
  const roles = Array.isArray(u.roles) ? u.roles.join(', ') : ''

  return (
    <div className="appShell">
      <div className="topBar">
        <div className="topBarInner">
          <div className="row" style={{ gap: 14 }}>
            <a className="brand" href="/app">
              <span style={{ color: 'var(--accent)' }}>●</span>
              Inventario Web
            </a>
            <span className="pill">{u.email}</span>
            {roles && <span className="pill">Rol: {roles}</span>}
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', flex: 1 }}>
            <nav className="nav">
              <a href="/app">Dashboard</a>
              <a href="/app/catalog">Catálogos</a>
              <a href="/app/movements/new">Movimiento</a>
              <a href="/app/stock">Stock</a>
              <a href="/app/kardex">Kardex FIFO</a>
              <a href="/admin" target="_blank" rel="noreferrer">
                Admin
              </a>
            </nav>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 18, paddingBottom: 40 }}>
        {props.children}
      </div>
    </div>
  )
}

