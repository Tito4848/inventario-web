import { getPayload } from 'payload'
import config from '@payload-config'

import { canReportPurchases } from '@/access/purchasesAccess'
import { buildPurchaseListWhere, parsePurchaseListQuery } from '@/lib/purchases/listQuery'
import { sanitizePurchase } from '@/lib/purchases/sanitize'
import { requireAuth } from '@/lib/auth/requireAuth'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReportPurchases(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parsePurchaseListQuery(url)
  const reportType = url.searchParams.get('type') || 'summary'
  const payload = await getPayload({ config })

  const where = buildPurchaseListWhere(query)
  const result = await payload.find({
    collection: 'purchase-orders',
    where,
    limit: 1000,
    depth: 2,
    sort: '-orderDate',
    overrideAccess: false,
    user: auth.user,
  })

  const docs = result.docs.map((doc) => sanitizePurchase(doc as unknown as Record<string, unknown>))

  if (reportType === 'receptions') {
    const receptions = docs.flatMap((doc) =>
      (doc.receptions ?? []).map((rec) => ({
        orderId: doc.id,
        orderNumber: doc.orderNumber,
        supplierName: doc.supplierName,
        ...rec,
      })),
    )
    return Response.json({ type: 'receptions', total: receptions.length, docs: receptions })
  }

  if (reportType === 'by-supplier') {
    const grouped = new Map<string, { supplierName: string; count: number; total: number }>()
    for (const doc of docs) {
      const key = doc.supplier
      const prev = grouped.get(key) ?? { supplierName: doc.supplierName ?? key, count: 0, total: 0 }
      prev.count += 1
      prev.total += doc.total
      grouped.set(key, prev)
    }
    return Response.json({
      type: 'by-supplier',
      docs: [...grouped.entries()].map(([supplierId, data]) => ({ supplierId, ...data })),
    })
  }

  if (reportType === 'by-product') {
    const grouped = new Map<string, { productName: string; quantity: number; amount: number }>()
    for (const doc of docs) {
      for (const item of doc.items) {
        const prev = grouped.get(item.product) ?? {
          productName: item.productName ?? item.product,
          quantity: 0,
          amount: 0,
        }
        prev.quantity += item.quantity
        prev.amount += item.total
        grouped.set(item.product, prev)
      }
    }
    return Response.json({
      type: 'by-product',
      docs: [...grouped.entries()].map(([productId, data]) => ({ productId, ...data })),
    })
  }

  if (reportType === 'by-user') {
    const grouped = new Map<string, { userName: string; count: number; total: number }>()
    for (const doc of docs) {
      const key = doc.createdBy ?? 'unknown'
      const prev = grouped.get(key) ?? { userName: doc.createdByName ?? key, count: 0, total: 0 }
      prev.count += 1
      prev.total += doc.total
      grouped.set(key, prev)
    }
    return Response.json({
      type: 'by-user',
      docs: [...grouped.entries()].map(([userId, data]) => ({ userId, ...data })),
    })
  }

  if (reportType === 'pending') {
    const pending = docs.filter((d) => ['pending', 'partial', 'draft'].includes(d.status))
    return Response.json({ type: 'pending', total: pending.length, docs: pending })
  }

  return Response.json({
    type: 'summary',
    totalDocs: result.totalDocs,
    totalAmount: docs.reduce((sum, d) => sum + d.total, 0),
    docs,
  })
}
