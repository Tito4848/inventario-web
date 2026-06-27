import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule, getDefaultAppRoute } from '@/access/permissions'
import type { User } from '@/payload-types'

const items = [
  { name: 'Productos', href: '/admin/collections/products' },
  { name: 'Categorías', href: '/admin/collections/categories' },
  { name: 'Unidades', href: '/admin/collections/units' },
  { name: 'Equivalencias', href: '/admin/collections/unit-equivalences' },
  { name: 'Almacenes', href: '/admin/collections/warehouses' },
  { name: 'Secciones', href: '/admin/collections/sections' },
  { name: 'Racks', href: '/admin/collections/racks' },
  { name: 'Usuarios', href: '/admin/collections/users' },
]

export default async function CatalogPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const u = user as User
  if (!canAccessModule(u, 'products')) redirect(getDefaultAppRoute(u))

  return (
    <div className="card">
      <div className="cardHeader">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Catálogos</div>
          <span className="pill">Administración</span>
        </div>
        <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
          Los catálogos maestros se gestionan desde el panel de Payload (seguro y con roles).
        </p>
      </div>
      <div className="cardBody">
        <div className="row" style={{ gap: 10 }}>
          {items.map((i) => (
            <a key={i.href} className="btn" href={i.href} target="_blank" rel="noreferrer">
              {i.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
