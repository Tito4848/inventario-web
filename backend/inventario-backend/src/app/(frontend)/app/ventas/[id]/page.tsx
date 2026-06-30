import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { canReadSales } from '@/access/salesAccess'
import type { User } from '@/payload-types'

import { VentaDetalleUI } from './ui'

type Props = { params: Promise<{ id: string }> }

export default async function VentaDetallePage({ params }: Props) {
  const { id } = await params
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) redirect('/login')
  if (!canReadSales(user as User)) redirect('/app')

  return <VentaDetalleUI id={id} />
}
