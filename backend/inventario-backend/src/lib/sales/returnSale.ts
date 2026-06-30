import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { writeAuditLog } from '@/lib/audit/logAction'
import { canTransitionToReturned, normalizeSaleStatus } from '@/lib/sales/validation'

function relId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return ''
}

type SaleItem = {
  product: unknown
  quantity: number
}

export async function returnSaleOrder(params: {
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
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  const orderRec = order as unknown as Record<string, unknown>
  const status = normalizeSaleStatus(String(orderRec.status ?? ''))

  if (!canTransitionToReturned(status)) {
    throw new Error('Solo se pueden devolver ventas entregadas.')
  }

  const rackId = relId(orderRec.rack)
  if (!rackId) throw new Error('La venta no tiene rack de despacho registrado.')

  const items = (Array.isArray(orderRec.items) ? orderRec.items : []) as SaleItem[]
  const orderNumber = String(orderRec.orderNumber ?? orderId)
  const customerId = relId(orderRec.customer)
  const movementIds: string[] = []

  for (const item of items) {
    const productId = relId(item.product)
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      overrideAccess: true,
      req,
    }).catch(() => null)
    if (!product) throw new Error(`Producto ${productId} no existe.`)

    const baseUnitId = relId((product as { baseUnit?: unknown }).baseUnit)
    if (!baseUnitId) throw new Error(`El producto no tiene unidad base configurada.`)

    const movement = await payload.create({
      collection: 'stock-movements',
      data: {
        label: `Devolución venta ${orderNumber}`,
        movementType: 'in',
        date: new Date().toISOString(),
        product: productId,
        rack: rackId,
        quantity: Number(item.quantity ?? 0),
        unit: baseUnitId,
        unitCost: 0,
        notes: `Devolución | Cliente: ${customerId} | OV: ${orderNumber}`,
        createdBy: user.id,
      },
      depth: 0,
      overrideAccess: false,
      user,
      req,
    })
    movementIds.push(String(movement.id))
  }

  const updated = await payload.update({
    collection: 'sales-orders',
    id: orderId,
    data: { status: 'returned', returnedAt: new Date().toISOString() },
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  await writeAuditLog({
    req,
    userId: user.id,
    action: 'sale.return',
    module: 'sales',
    resourceId: orderId,
    details: { orderNumber, movementIds },
    ip,
    userAgent,
  })

  return { doc: updated as unknown as Record<string, unknown> }
}
