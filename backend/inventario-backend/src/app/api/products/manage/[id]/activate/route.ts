import { getPayload } from 'payload'
import config from '@payload-config'

import { canToggleProductStatus } from '@/access/productsAccess'
import {
  aggregateStockByProduct,
  sanitizeProductForList,
} from '@/lib/products/sanitize'
import { requireAuth } from '@/lib/auth/requireAuth'

import { getTargetProduct } from '@/lib/products/targetProduct'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

async function setActive(req: Request, context: RouteContext, active: boolean) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canToggleProductStatus(auth.user)) return forbidden()

  const { id } = await context.params
  const target = await getTargetProduct(id, auth.user)
  if (target instanceof Response) return target

  const payload = await getPayload({ config })
  const updated = await payload.update({
    collection: 'products',
    id,
    data: {
      active,
      status: active ? 'active' : 'inactive',
    },
    depth: 2,
    overrideAccess: false,
    user: auth.user,
  })

  const stockByProduct = await aggregateStockByProduct(payload, [id])

  return Response.json({
    doc: sanitizeProductForList(updated as unknown as Record<string, unknown>, stockByProduct),
  })
}

export async function POST(req: Request, context: RouteContext) {
  return setActive(req, context, true)
}
