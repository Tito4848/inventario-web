import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canDeleteSales,
  canReadSales,
  canUpdateSales,
} from '@/access/salesAccess'
import { getClientMeta, writeAuditLogWithPayload } from '@/lib/audit/logAction'
import { requireAuth } from '@/lib/auth/requireAuth'
import { sanitizeSale } from '@/lib/sales/sanitize'
import {
  computeLineTotal,
  computeSaleTotals,
  isEditableSaleStatus,
  normalizeSaleStatus,
  parseSaleUpdateBody,
} from '@/lib/sales/validation'

import type { User } from '@/payload-types'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

const PATCH_BLOCKED_STATUSES = new Set(['confirmed', 'delivered', 'returned', 'cancelled'])

async function loadSale(id: string, user: User) {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({
      collection: 'sales-orders',
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
  if (!canReadSales(auth.user)) return forbidden()

  const { id } = await context.params
  const { doc } = await loadSale(id, auth.user)
  if (!doc) return Response.json({ error: 'Venta no encontrada' }, { status: 404 })

  return Response.json({ doc: sanitizeSale(doc as unknown as Record<string, unknown>) })
}

export async function PUT(req: Request, context: RouteContext) {
  return PATCH(req, context)
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canUpdateSales(auth.user)) return forbidden()

  const { id } = await context.params
  const { payload, doc } = await loadSale(id, auth.user)
  if (!doc) return Response.json({ error: 'Venta no encontrada' }, { status: 404 })

  const current = doc as unknown as Record<string, unknown>
  const currentStatus = normalizeSaleStatus(String(current.status ?? 'draft'))

  try {
    const body = (await req.json()) as Record<string, unknown>

    if (PATCH_BLOCKED_STATUSES.has(currentStatus)) {
      return Response.json({ error: 'La venta no es editable en su estado actual' }, { status: 400 })
    }

    if (!isEditableSaleStatus(currentStatus)) {
      return Response.json({ error: 'La venta no es editable en su estado actual' }, { status: 400 })
    }

    const parsed = parseSaleUpdateBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data

    if (
      data.status &&
      !['draft', 'pending'].includes(data.status)
    ) {
      return Response.json(
        { error: 'Use los endpoints dedicados para confirmar, entregar, cancelar o devolver' },
        { status: 400 },
      )
    }

    const existingItems = Array.isArray(current.items) ? current.items : []
    const itemsInput =
      data.items ??
      existingItems.map((raw) => {
        const row = raw as Record<string, unknown>
        return {
          product: String(typeof row.product === 'object' ? (row.product as { id: string }).id : row.product),
          quantity: Number(row.quantity ?? 0),
          unitPrice: Number(row.unitPrice ?? 0),
          discount: Number(row.discount ?? 0),
        }
      })

    const discountAmount = data.discountAmount ?? Number(current.discountAmount ?? 0)
    const tax = data.tax ?? Number(current.tax ?? 0)
    const { subtotal, total } = computeSaleTotals(itemsInput, discountAmount, tax)

    const updateData: Record<string, unknown> = {
      ...(data.customer ? { customer: data.customer } : {}),
      ...(data.saleDate ? { saleDate: data.saleDate } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.rack !== undefined ? { rack: data.rack } : {}),
      tax,
      discountAmount,
      subtotal,
      total,
    }

    if (data.items) {
      updateData.items = itemsInput.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: computeLineTotal(item),
      }))
    }

    const updated = await payload.update({
      collection: 'sales-orders',
      id,
      data: updateData,
      depth: 2,
      overrideAccess: false,
      user: auth.user,
    })

    const meta = getClientMeta(req)
    await writeAuditLogWithPayload({
      payload,
      user: auth.user,
      userId: auth.user.id,
      action: 'sale.update',
      module: 'sales',
      resourceId: id,
      details: { status: data.status ?? currentStatus },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json({ doc: sanitizeSale(updated as unknown as Record<string, unknown>) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo actualizar la venta'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canDeleteSales(auth.user)) return forbidden()

  const { id } = await context.params
  const { payload, doc } = await loadSale(id, auth.user)
  if (!doc) return Response.json({ error: 'Venta no encontrada' }, { status: 404 })

  const status = normalizeSaleStatus(String((doc as { status?: string }).status ?? ''))
  if (status === 'delivered' || status === 'returned') {
    return Response.json({ error: 'No se puede eliminar una venta entregada' }, { status: 400 })
  }
  if (status === 'confirmed') {
    return Response.json({ error: 'No se puede eliminar una venta confirmada' }, { status: 400 })
  }

  await payload.delete({
    collection: 'sales-orders',
    id,
    overrideAccess: false,
    user: auth.user,
  })

  const meta = getClientMeta(req)
  await writeAuditLogWithPayload({
    payload,
    user: auth.user,
    userId: auth.user.id,
    action: 'sale.delete',
    module: 'sales',
    resourceId: id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  })

  return Response.json({ message: 'Venta eliminada' })
}
