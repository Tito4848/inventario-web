import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { writeAuditLog } from '@/lib/audit/logAction'
import { checkStockAvailability } from '@/lib/sales/stockCheck'
import {
  canConfirmSaleStatus,
  normalizeSaleStatus,
  type ConfirmBodyInput,
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

export async function confirmSaleOrder(params: {
  req: PayloadRequest
  user: User
  orderId: string
  body: ConfirmBodyInput
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
    throw new Error('No se puede confirmar una venta cancelada.')
  }
  if (!canConfirmSaleStatus(status)) {
    throw new Error('La venta no está en estado confirmable (borrador o pendiente).')
  }

  const rackId = body.rack || relId(orderRec.rack)
  if (!rackId) throw new Error('Rack requerido para confirmar la venta.')

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
  const now = new Date().toISOString()

  const updated = await payload.update({
    collection: 'sales-orders',
    id: orderId,
    data: {
      status: 'confirmed',
      confirmedAt: now,
      rack: rackId,
    },
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  await writeAuditLog({
    req,
    userId: user.id,
    action: 'sale.confirm',
    module: 'sales',
    resourceId: orderId,
    details: { orderNumber, rack: rackId, notes: body.notes },
    ip,
    userAgent,
  })

  return { doc: updated as unknown as Record<string, unknown> }
}
