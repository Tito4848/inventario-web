import { getPayload } from 'payload'
import config from '@payload-config'

import { canReturnSales } from '@/access/salesAccess'
import { getClientMeta } from '@/lib/audit/logAction'
import { requireAuth } from '@/lib/auth/requireAuth'
import { returnSaleOrder } from '@/lib/sales/returnSale'
import { sanitizeSale } from '@/lib/sales/sanitize'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReturnSales(auth.user)) return forbidden()

  const { id } = await context.params

  try {
    const payload = await getPayload({ config })
    const meta = getClientMeta(req)

    const { doc } = await returnSaleOrder({
      req: { payload, user: auth.user } as never,
      user: auth.user,
      orderId: id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json({ doc: sanitizeSale(doc) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo devolver la venta'
    const status = message.includes('no encontrada') ? 404 : 400
    return Response.json({ error: message }, { status })
  }
}
