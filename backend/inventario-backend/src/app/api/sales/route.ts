import { getPayload } from 'payload'
import config from '@payload-config'

import { canCreateSales, canReadSales } from '@/access/salesAccess'
import { getClientMeta, writeAuditLogWithPayload } from '@/lib/audit/logAction'
import { requireAuth } from '@/lib/auth/requireAuth'
import { generateSaleOrderNumber } from '@/lib/sales/orderNumber'
import { buildSaleListWhere, parseSaleListQuery } from '@/lib/sales/listQuery'
import { sanitizeSale } from '@/lib/sales/sanitize'
import {
  computeLineTotal,
  computeSaleTotals,
  parseSaleBody,
} from '@/lib/sales/validation'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

async function validateCustomer(
  payload: Awaited<ReturnType<typeof getPayload>>,
  customerId: string,
): Promise<string | null> {
  try {
    await payload.findByID({
      collection: 'customers',
      id: customerId,
      depth: 0,
      overrideAccess: true,
    })
    return null
  } catch {
    return 'Cliente no encontrado'
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

async function validateRack(
  payload: Awaited<ReturnType<typeof getPayload>>,
  rackId: string,
): Promise<string | null> {
  try {
    await payload.findByID({
      collection: 'racks',
      id: rackId,
      depth: 0,
      overrideAccess: true,
    })
    return null
  } catch {
    return 'Rack no encontrado'
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReadSales(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parseSaleListQuery(url)
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'sales-orders',
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    where: buildSaleListWhere(query),
    depth: 2,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({
    docs: result.docs.map((doc) => sanitizeSale(doc as unknown as Record<string, unknown>)),
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
  if (!canCreateSales(auth.user)) return forbidden()

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseSaleBody(body)
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const payload = await getPayload({ config })

    const customerError = await validateCustomer(payload, data.customer)
    if (customerError) return Response.json({ error: customerError }, { status: 400 })

    const productError = await validateProducts(
      payload,
      data.items.map((i) => i.product),
    )
    if (productError) return Response.json({ error: productError }, { status: 400 })

    if (data.rack) {
      const rackError = await validateRack(payload, data.rack)
      if (rackError) return Response.json({ error: rackError }, { status: 400 })
    }

    const { subtotal, total } = computeSaleTotals(data.items, data.discountAmount, data.tax)
    const orderNumber = await generateSaleOrderNumber(payload)

    const created = await payload.create({
      collection: 'sales-orders',
      data: {
        orderNumber,
        customer: data.customer,
        saleDate: data.saleDate,
        status: data.status ?? 'draft',
        tax: data.tax,
        discountAmount: data.discountAmount,
        notes: data.notes,
        rack: data.rack,
        subtotal,
        total,
        items: data.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: computeLineTotal(item),
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
      action: 'sale.create',
      module: 'sales',
      resourceId: String(created.id),
      details: { orderNumber: created.orderNumber },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return Response.json(
      { doc: sanitizeSale(created as unknown as Record<string, unknown>) },
      { status: 201 },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo crear la venta'
    return Response.json({ error: message }, { status: 400 })
  }
}
