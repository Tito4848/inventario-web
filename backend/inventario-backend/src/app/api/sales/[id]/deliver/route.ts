import { getPayload } from 'payload'
import config from '@payload-config'

import { canDeliverSales } from '@/access/salesAccess'
import { getClientMeta } from '@/lib/audit/logAction'
import { requireAuth } from '@/lib/auth/requireAuth'
import { deliverSaleOrder } from '@/lib/sales/deliver'
import { sanitizeSale } from '@/lib/sales/sanitize'
import { parseDeliverBody } from '@/lib/sales/validation'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canDeliverSales(auth.user)) return forbidden()

  const { id } = await context.params

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const parsed = parseDeliverBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const meta = getClientMeta(req)

    const { doc } = await deliverSaleOrder({
      req: { payload, user: auth.user } as never,
      user: auth.user,
      orderId: id,
      body: parsed.data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json({ doc: sanitizeSale(doc) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo entregar la venta'
    const status = message.includes('no encontrada') ? 404 : 400
    return Response.json({ error: message }, { status })
  }
}
