import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { writeAuditLog } from '@/lib/audit/logAction'
import { canCancelSaleStatus, normalizeSaleStatus } from '@/lib/sales/validation'

export async function cancelSaleOrder(params: {
  req: PayloadRequest
  user: User
  orderId: string
  ip?: string | null
  userAgent?: string | null
}): Promise<{ doc: Record<string, unknown> }> {
  const { req, user, orderId, ip, userAgent } = params
  const payload = req.payload

  const order = await payload.findByID({
    collection: 'sales-orders',
    id: orderId,
    depth: 0,
    overrideAccess: false,
    user,
    req,
  })

  const orderRec = order as unknown as Record<string, unknown>
  const status = normalizeSaleStatus(String(orderRec.status ?? ''))

  if (!canCancelSaleStatus(status)) {
    throw new Error('Solo se pueden cancelar ventas antes de ser entregadas.')
  }

  const updated = await payload.update({
    collection: 'sales-orders',
    id: orderId,
    data: { status: 'cancelled' },
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  await writeAuditLog({
    req,
    userId: user.id,
    action: 'sale.cancel',
    module: 'sales',
    resourceId: orderId,
    details: { orderNumber: orderRec.orderNumber },
    ip,
    userAgent,
  })

  return { doc: updated as unknown as Record<string, unknown> }
}
