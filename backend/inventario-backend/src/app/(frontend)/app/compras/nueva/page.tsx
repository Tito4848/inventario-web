import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canAccessModule } from '@/access/permissions'
import type { User } from '@/payload-types'

import { CompraFormUI } from './ui'

export default async function NuevaCompraPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')
  if (!canAccessModule(user as User, 'purchases')) redirect('/app')

  return <CompraFormUI />
}
