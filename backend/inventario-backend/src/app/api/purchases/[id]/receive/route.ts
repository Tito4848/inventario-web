import { getPayload } from 'payload'
import config from '@payload-config'

import { canReceivePurchases } from '@/access/purchasesAccess'
import { getClientMeta } from '@/lib/audit/logAction'
import { sanitizePurchase } from '@/lib/purchases/sanitize'
import { receivePurchaseOrder } from '@/lib/purchases/receive'
import { parseReceiveBody } from '@/lib/purchases/validation'
import { requireAuth } from '@/lib/auth/requireAuth'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReceivePurchases(auth.user)) return forbidden()

  const { id } = await context.params

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseReceiveBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const meta = getClientMeta(req)

    const { doc } = await receivePurchaseOrder({
      req: { payload, user: auth.user } as never,
      user: auth.user,
      orderId: id,
      body: parsed.data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json({ doc: sanitizePurchase(doc) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo recepcionar la compra'
    const status = message.includes('no encontrada') ? 404 : 400
    return Response.json({ error: message }, { status })
  }
}
