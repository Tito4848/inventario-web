import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import { writeAuditLog } from '@/lib/audit/logAction'
import {
  canReceiveStatus,
  computeLineSubtotal,
  normalizePurchaseStatus,
  type ReceiveBodyInput,
} from '@/lib/purchases/validation'

function relId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return ''
}

type POItem = {
  id?: string | null
  product: unknown
  quantity: number
  quantityReceived?: number | null
  unitCost: number
  discount?: number | null
  total?: number | null
}

export async function receivePurchaseOrder(params: {
  req: PayloadRequest
  user: User
  orderId: string
  body: ReceiveBodyInput
  ip?: string | null
  userAgent?: string | null
}): Promise<{ doc: Record<string, unknown> }> {
  const { req, user, orderId, body, ip, userAgent } = params
  const payload = req.payload

  const order = await payload.findByID({
    collection: 'purchase-orders',
    id: orderId,
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  const orderRec = order as unknown as Record<string, unknown>
  const status = normalizePurchaseStatus(String(orderRec.status ?? ''))

  if (status === 'cancelled') {
    throw new Error('No se puede recibir una compra cancelada.')
  }
  if (status === 'received') {
    throw new Error('La orden ya fue recibida completamente.')
  }
  if (!canReceiveStatus(status)) {
    throw new Error('La orden no está en estado recepcionable.')
  }

  const rackExists = await payload.findByID({
    collection: 'racks',
    id: body.rack,
    depth: 0,
    overrideAccess: true,
    req,
  }).catch(() => null)
  if (!rackExists) throw new Error('Rack no encontrado.')

  const items = (Array.isArray(orderRec.items) ? orderRec.items : []) as POItem[]
  const itemsByProduct = new Map<string, POItem>()
  for (const item of items) {
    const productId = relId(item.product)
    if (productId) itemsByProduct.set(productId, item)
  }

  const receptionItems: Array<{ product: string; quantity: number }> = []
  const updatedItems = items.map((item) => ({ ...item }))

  for (const receiveLine of body.items) {
    const poItem = itemsByProduct.get(receiveLine.product)
    if (!poItem) {
      throw new Error(`El producto ${receiveLine.product} no pertenece a la orden.`)
    }

    const ordered = Number(poItem.quantity ?? 0)
    const already = Number(poItem.quantityReceived ?? 0)
    const pending = ordered - already
    if (receiveLine.quantity > pending + 0.0000001) {
      throw new Error(
        `Cantidad a recibir excede lo pendiente para el producto (${pending.toFixed(4)} pendiente).`,
      )
    }

    const product = await payload.findByID({
      collection: 'products',
      id: receiveLine.product,
      depth: 0,
      overrideAccess: true,
      req,
    }).catch(() => null)
    if (!product) throw new Error(`Producto ${receiveLine.product} no existe.`)

    const baseUnitId = relId((product as { baseUnit?: unknown }).baseUnit)
    if (!baseUnitId) throw new Error(`El producto no tiene unidad base configurada.`)

    const unitCost = Number(poItem.unitCost ?? 0)
    const movement = await payload.create({
      collection: 'stock-movements',
      data: {
        label: `Recepción OC ${String(orderRec.orderNumber ?? orderId)}`,
        movementType: 'in',
        date: new Date().toISOString(),
        product: receiveLine.product,
        rack: body.rack,
        quantity: receiveLine.quantity,
        unit: baseUnitId,
        unitCost,
        notes: body.notes
          ? `${body.notes} | Proveedor: ${relId(orderRec.supplier)} | OC: ${String(orderRec.orderNumber ?? '')}`
          : `Proveedor: ${relId(orderRec.supplier)} | OC: ${String(orderRec.orderNumber ?? '')}`,
        createdBy: user.id,
      },
      depth: 0,
      overrideAccess: false,
      user,
      req,
    })

    receptionItems.push({ product: receiveLine.product, quantity: receiveLine.quantity })

    const idx = updatedItems.findIndex((i) => relId(i.product) === receiveLine.product)
    if (idx >= 0) {
      updatedItems[idx] = {
        ...updatedItems[idx],
        quantityReceived: already + receiveLine.quantity,
      }
    }

    void movement
  }

  const allReceived = updatedItems.every(
    (item) => Number(item.quantityReceived ?? 0) >= Number(item.quantity ?? 0) - 0.0000001,
  )
  const anyReceived = updatedItems.some((item) => Number(item.quantityReceived ?? 0) > 0)
  const nextStatus = allReceived ? 'received' : anyReceived ? 'partial' : status

  const existingReceptions = Array.isArray(orderRec.receptions) ? [...orderRec.receptions] : []
  existingReceptions.push({
    date: new Date().toISOString(),
    receivedBy: user.id,
    notes: body.notes,
    items: receptionItems,
  })

  const updated = await payload.update({
    collection: 'purchase-orders',
    id: orderId,
    data: {
      items: updatedItems.map((item) => ({
        product: relId(item.product),
        quantity: Number(item.quantity ?? 0),
        unitCost: Number(item.unitCost ?? 0),
        discount: Number(item.discount ?? 0),
        quantityReceived: Number(item.quantityReceived ?? 0),
        total: computeLineSubtotal({
          product: relId(item.product),
          quantity: Number(item.quantity ?? 0),
          unitCost: Number(item.unitCost ?? 0),
          discount: Number(item.discount ?? 0),
        }),
      })),
      status: nextStatus,
      receivedDate: allReceived
        ? new Date().toISOString()
        : orderRec.receivedDate != null
          ? String(orderRec.receivedDate)
          : undefined,
      receptions: existingReceptions,
    },
    depth: 1,
    overrideAccess: false,
    user,
    req,
  })

  await writeAuditLog({
    req,
    userId: user.id,
    action: 'purchase.receive',
    module: 'purchases',
    resourceId: orderId,
    details: { items: receptionItems, status: nextStatus },
    ip,
    userAgent,
  })

  return { doc: updated as unknown as Record<string, unknown> }
}
