import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { writeAuditLog } from '@/lib/audit/logAction'
import { checkStockAvailability } from '@/lib/sales/stockCheck'
import {
  canTransitionToDelivered,
  normalizeSaleStatus,
  type DeliverBodyInput,
} from '@/lib/sales/validation'

function relId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return ''
}

type SaleItem = {
  product: unknown
  quantity: number
}

export async function deliverSaleOrder(params: {
  req: PayloadRequest
  user: User
  orderId: string
  body: DeliverBodyInput
  ip?: string | null
  userAgent?: string | null
}): Promise<{ doc: Record<string, unknown> }> {
  const { req, user, orderId, body, ip, userAgent } = params
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

  if (status === 'cancelled') {
    throw new Error('No se puede entregar una venta cancelada.')
  }
  if (!canTransitionToDelivered(status)) {
    throw new Error('La venta debe estar confirmada para entregar.')
  }

  const rackId = body.rack || relId(orderRec.rack)
  if (!rackId) throw new Error('Rack requerido para entregar la venta.')

  const rackExists = await payload
    .findByID({
      collection: 'racks',
      id: rackId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null)
  if (!rackExists) throw new Error('Rack no encontrado.')

  const items = (Array.isArray(orderRec.items) ? orderRec.items : []) as SaleItem[]
  if (!items.length) throw new Error('La venta no tiene productos.')

  const stockLines: Array<{ product: string; quantity: number; unit: string }> = []

  for (const item of items) {
    const productId = relId(item.product)
    if (!productId) throw new Error('Producto inválido en la venta.')

    const product = await payload
      .findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        overrideAccess: true,
        req,
      })
      .catch(() => null)
    if (!product) throw new Error(`Producto ${productId} no existe.`)

    const baseUnitId = relId((product as { baseUnit?: unknown }).baseUnit)
    if (!baseUnitId) throw new Error(`El producto no tiene unidad base configurada.`)

    stockLines.push({
      product: productId,
      quantity: Number(item.quantity ?? 0),
      unit: baseUnitId,
    })
  }

  const stockError = await checkStockAvailability({ req, rackId, lines: stockLines })
  if (stockError) throw new Error(stockError)

  const orderNumber = String(orderRec.orderNumber ?? orderId)
  const customerId = relId(orderRec.customer)
  const movementIds: string[] = []
  const deliveryItems: Array<{ product: string; quantity: number }> = []

  for (const item of items) {
    const productId = relId(item.product)
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const baseUnitId = relId((product as { baseUnit?: unknown }).baseUnit)
    const quantity = Number(item.quantity ?? 0)

    const movement = await payload.create({
      collection: 'stock-movements',
      data: {
        label: `Salida venta ${orderNumber}`,
        movementType: 'out',
        date: new Date().toISOString(),
        product: productId,
        rack: rackId,
        quantity,
        unit: baseUnitId,
        notes: body.notes
          ? `${body.notes} | Cliente: ${customerId} | OV: ${orderNumber}`
          : `Cliente: ${customerId} | OV: ${orderNumber}`,
        createdBy: user.id,
      },
      depth: 0,
      overrideAccess: false,
      user,
      req,
    })

    movementIds.push(String(movement.id))
    deliveryItems.push({ product: productId, quantity })
  }

  const now = new Date().toISOString()
  const existingDeliveries = Array.isArray(orderRec.deliveries) ? [...orderRec.deliveries] : []
  existingDeliveries.push({
    date: now,
    deliveredBy: user.id,
    notes: body.notes,
    items: deliveryItems,
    movementIds: movementIds.map((movementId) => ({ movementId })),
  })

  const updated = await payload.update({
    collection: 'sales-orders',
    id: orderId,
    data: {
      status: 'delivered',
      deliveredAt: now,
      rack: rackId,
      deliveries: existingDeliveries,
    },
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  await writeAuditLog({
    req,
    userId: user.id,
    action: 'sale.deliver',
    module: 'sales',
    resourceId: orderId,
    details: { orderNumber, movementIds, rack: rackId },
    ip,
    userAgent,
  })

  return { doc: updated as unknown as Record<string, unknown> }
}
