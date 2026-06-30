import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule } from '@/access/permissions'
import { canCreateSales } from '@/access/salesAccess'
import type { User } from '@/payload-types'

import { VentaFormUI } from './ui'

export default async function NuevaVentaPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')
  if (!canAccessModule(user as User, 'sales')) redirect('/app')
  if (!canCreateSales(user as User)) redirect('/app/ventas')

  return <VentaFormUI />
}
