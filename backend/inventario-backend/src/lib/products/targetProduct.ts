import { getPayload } from 'payload'
import config from '@payload-config'

import type { User } from '@/payload-types'

export async function getTargetProduct(
  id: string,
  actor: User,
): Promise<Record<string, unknown> | Response> {
  const payload = await getPayload({ config })
  try {
    const target = await payload.findByID({
      collection: 'products',
      id,
      depth: 2,
      overrideAccess: false,
      user: actor,
    })
    return target as unknown as Record<string, unknown>
  } catch {
    return Response.json({ error: 'Producto no encontrado' }, { status: 404 })
  }
}
