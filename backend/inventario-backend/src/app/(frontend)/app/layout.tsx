import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, formatUserRoles } from '@/access/permissions'
import type { User } from '@/payload-types'

import { LogoutButton } from './ui'

type NavItem = { href: string; label: string; module: Parameters<typeof canAccessModule>[1] }

const navItems: NavItem[] = [
  { href: '/app', label: 'Dashboard', module: 'dashboard' },
  { href: '/app/portal', label: 'Mi portal', module: 'portal' },
  { href: '/app/catalog', label: 'Catálogos', module: 'products' },
  { href: '/app/movements/new', label: 'Movimiento', module: 'movements' },
  { href: '/app/movements', label: 'Historial', module: 'movements' },
  { href: '/app/stock', label: 'Stock', module: 'stock' },
  { href: '/app/kardex', label: 'Kardex FIFO', module: 'kardex' },
  { href: '/app/compras', label: 'Compras', module: 'purchases' },
]

export default async function AppLayout(props: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')

  const u = user as User
  const rolesLabel = formatUserRoles(u)
  const visibleNav = navItems.filter((item) => {
    if (item.module === 'portal' && canAccessModule(u, 'dashboard')) return false
    return canAccessModule(u, item.module)
  })

  return (
    <div className="appShell">
      <div className="topBar">
        <div className="topBarInner">
          <div className="row" style={{ gap: 14 }}>
            <a className="brand" href={visibleNav[0]?.href ?? '/app'}>
              <span style={{ color: 'var(--accent)' }}>●</span>
              Inventario Web
            </a>
            <span className="pill">{u.email}</span>
            {rolesLabel && <span className="pill">Rol: {rolesLabel}</span>}
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', flex: 1 }}>
            <nav className="nav">
              {visibleNav.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
              {canAccessModule(u, 'users') && (
                <a href="/admin" target="_blank" rel="noreferrer">
                  Admin
                </a>
              )}
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
