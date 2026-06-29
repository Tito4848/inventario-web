import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canCreatePurchases,
  canReadPurchases,
} from '@/access/purchasesAccess'
import { getClientMeta, writeAuditLogWithPayload } from '@/lib/audit/logAction'
import { generatePurchaseOrderNumber } from '@/lib/purchases/orderNumber'
import { buildPurchaseListWhere, parsePurchaseListQuery } from '@/lib/purchases/listQuery'
import { sanitizePurchase } from '@/lib/purchases/sanitize'
import {
  computeLineSubtotal,
  computePurchaseTotals,
  parsePurchaseBody,
} from '@/lib/purchases/validation'
import { requireAuth } from '@/lib/auth/requireAuth'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

async function validateSupplier(
  payload: Awaited<ReturnType<typeof getPayload>>,
  supplierId: string,
): Promise<string | null> {
  try {
    await payload.findByID({
      collection: 'suppliers',
      id: supplierId,
      depth: 0,
      overrideAccess: true,
    })
    return null
  } catch {
    return 'Proveedor no encontrado'
  }
}

async function validateProducts(
  payload: Awaited<ReturnType<typeof getPayload>>,
  productIds: string[],
): Promise<string | null> {
  for (const id of productIds) {
    try {
      await payload.findByID({
        collection: 'products',
        id,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return `Producto ${id} no existe`
    }
  }
  return null
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReadPurchases(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parsePurchaseListQuery(url)
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'purchase-orders',
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    where: buildPurchaseListWhere(query),
    depth: 2,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({
    docs: result.docs.map((doc) => sanitizePurchase(doc as unknown as Record<string, unknown>)),
    totalDocs: result.totalDocs,
    limit: result.limit,
    page: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  })
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canCreatePurchases(auth.user)) return forbidden()

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parsePurchaseBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const payload = await getPayload({ config })

    const supplierError = await validateSupplier(payload, data.supplier)
    if (supplierError) return Response.json({ error: supplierError }, { status: 400 })

    const productError = await validateProducts(
      payload,
      data.items.map((i) => i.product),
    )
    if (productError) return Response.json({ error: productError }, { status: 400 })

    const { subtotal, total } = computePurchaseTotals(data.items, data.discount, data.tax)
    const orderNumber = await generatePurchaseOrderNumber(payload)

    const created = await payload.create({
      collection: 'purchase-orders',
      data: {
        orderNumber,
        supplier: data.supplier,
        orderDate: data.orderDate,
        status: data.status ?? 'draft',
        currency: data.currency as 'PEN' | 'USD',
        tax: data.tax,
        discount: data.discount,
        notes: data.notes,
        rack: data.rack,
        subtotal,
        total,
        items: data.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitCost: item.unitCost,
          discount: item.discount,
          quantityReceived: 0,
          total: computeLineSubtotal(item),
        })),
        createdBy: auth.user.id,
      },
      depth: 2,
      overrideAccess: false,
      user: auth.user,
    })

    const meta = getClientMeta(req)
    await writeAuditLogWithPayload({
      payload,
      user: auth.user,
      userId: auth.user.id,
      action: 'purchase.create',
      module: 'purchases',
      resourceId: String(created.id),
      details: { orderNumber: created.orderNumber },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json(
      { doc: sanitizePurchase(created as unknown as Record<string, unknown>) },
      { status: 201 },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo crear la compra'
    return Response.json({ error: message }, { status: 400 })
  }
}
