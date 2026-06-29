import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canDeletePurchases,
  canReadPurchases,
  canUpdatePurchases,
} from '@/access/purchasesAccess'
import { getClientMeta, writeAuditLogWithPayload } from '@/lib/audit/logAction'
import { sanitizePurchase } from '@/lib/purchases/sanitize'
import {
  computeLineSubtotal,
  computePurchaseTotals,
  isEditableStatus,
  parsePurchaseUpdateBody,
} from '@/lib/purchases/validation'
import { requireAuth } from '@/lib/auth/requireAuth'

import type { User } from '@/payload-types'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

async function loadPurchase(id: string, user: User) {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({
      collection: 'purchase-orders',
      id,
      depth: 2,
      overrideAccess: false,
      user,
    })
    return { payload, doc }
  } catch {
    return { payload, doc: null }
  }
}

export async function GET(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReadPurchases(auth.user)) return forbidden()

  const { id } = await context.params
  const { doc } = await loadPurchase(id, auth.user)
  if (!doc) return Response.json({ error: 'Orden no encontrada' }, { status: 404 })

  return Response.json({ doc: sanitizePurchase(doc as unknown as Record<string, unknown>) })
}

export async function PUT(req: Request, context: RouteContext) {
  return PATCH(req, context)
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canUpdatePurchases(auth.user)) return forbidden()

  const { id } = await context.params
  const { payload, doc } = await loadPurchase(id, auth.user)
  if (!doc) return Response.json({ error: 'Orden no encontrada' }, { status: 404 })

  const current = doc as unknown as Record<string, unknown>
  const currentStatus = String(current.status ?? 'draft')

  try {
    const body = (await req.json()) as Record<string, unknown>

    if (currentStatus === 'cancelled') {
      return Response.json({ error: 'No se puede editar una orden cancelada' }, { status: 400 })
    }

    if (!isEditableStatus(currentStatus) && currentStatus !== 'partial' && body.status !== 'cancelled') {
      return Response.json({ error: 'La orden no es editable en su estado actual' }, { status: 400 })
    }

    const parsed = parsePurchaseUpdateBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const existingItems = Array.isArray(current.items) ? current.items : []
    const itemsInput =
      data.items ??
      existingItems.map((raw) => {
        const row = raw as Record<string, unknown>
        return {
          product: String(typeof row.product === 'object' ? (row.product as { id: string }).id : row.product),
          quantity: Number(row.quantity ?? 0),
          unitCost: Number(row.unitCost ?? 0),
          discount: Number(row.discount ?? 0),
        }
      })

    const orderDiscount = data.discount ?? Number(current.discount ?? 0)
    const tax = data.tax ?? Number(current.tax ?? 0)
    const { subtotal, total } = computePurchaseTotals(itemsInput, orderDiscount, tax)

    const updated = await payload.update({
      collection: 'purchase-orders',
      id,
      data: {
        ...(data.supplier ? { supplier: data.supplier } : {}),
        ...(data.orderDate ? { orderDate: data.orderDate } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.currency ? { currency: data.currency as 'PEN' | 'USD' } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.rack !== undefined ? { rack: data.rack } : {}),
        tax,
        discount: orderDiscount,
        subtotal,
        total,
        ...(data.items
          ? {
              items: itemsInput.map((item, index) => {
                const prev = existingItems[index] as Record<string, unknown> | undefined
                return {
                  product: item.product,
                  quantity: item.quantity,
                  unitCost: item.unitCost,
                  discount: item.discount,
                  quantityReceived: Number(prev?.quantityReceived ?? 0),
                  total: computeLineSubtotal(item),
                }
              }),
            }
          : {}),
      },
      depth: 2,
      overrideAccess: false,
      user: auth.user,
    })

    const meta = getClientMeta(req)
    const action = data.status === 'cancelled' ? 'purchase.cancel' : 'purchase.update'
    await writeAuditLogWithPayload({
      payload,
      user: auth.user,
      userId: auth.user.id,
      action,
      module: 'purchases',
      resourceId: id,
      details: { status: data.status ?? currentStatus },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json({ doc: sanitizePurchase(updated as unknown as Record<string, unknown>) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo actualizar la compra'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canDeletePurchases(auth.user)) return forbidden()

  const { id } = await context.params
  const { payload, doc } = await loadPurchase(id, auth.user)
  if (!doc) return Response.json({ error: 'Orden no encontrada' }, { status: 404 })

  const status = String((doc as { status?: string }).status ?? '')
  if (status === 'partial' || status === 'received' || status === 'invoiced') {
    return Response.json({ error: 'No se puede eliminar una orden con recepciones' }, { status: 400 })
  }

  await payload.delete({
    collection: 'purchase-orders',
    id,
    overrideAccess: false,
    user: auth.user,
  })

  const meta = getClientMeta(req)
  await writeAuditLogWithPayload({
    payload,
    user: auth.user,
    userId: auth.user.id,
    action: 'purchase.delete',
    module: 'purchases',
    resourceId: id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return Response.json({ message: 'Orden eliminada' })
}
