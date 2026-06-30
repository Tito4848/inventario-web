import { getPayload } from 'payload'
import config from '@payload-config'

import { canReportSales } from '@/access/salesAccess'
import { requireAuth } from '@/lib/auth/requireAuth'
import { buildSaleListWhere, parseSaleListQuery } from '@/lib/sales/listQuery'
import { sanitizeSale } from '@/lib/sales/sanitize'
import {
  aggregateDailyRevenue,
  aggregateMonthlyRevenue,
  aggregateSalesByCategory,
  aggregateSalesByCustomer,
  aggregateSalesByDate,
  aggregateSalesByProduct,
  aggregateSalesByUser,
  aggregateTopCustomers,
  aggregateTopProducts,
  salesReportToCsv,
} from '@/lib/sales/stats'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReportSales(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parseSaleListQuery(url)
  const reportType = url.searchParams.get('type') || 'summary'
  const format = url.searchParams.get('format') || 'json'
  const payload = await getPayload({ config })

  const where = buildSaleListWhere(query)
  const result = await payload.find({
    collection: 'sales-orders',
    where,
    limit: 1000,
    depth: 2,
    sort: '-saleDate',
    overrideAccess: false,
    user: auth.user,
  })

  const docs = result.docs.map((doc) => sanitizeSale(doc as unknown as Record<string, unknown>))

  const respond = (type: string, rows: Record<string, unknown>[]) => {
    if (format === 'csv' || reportType === 'csv') {
      const csv = salesReportToCsv(type, rows)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sales-${type}.csv"`,
        },
      })
    }
    return Response.json({ type, docs: rows, total: rows.length })
  }

  if (reportType === 'by-date') {
    return respond('by-date', aggregateSalesByDate(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'by-customer') {
    return respond('by-customer', aggregateSalesByCustomer(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'by-product') {
    return respond('by-product', aggregateSalesByProduct(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'by-category') {
    return respond('by-category', aggregateSalesByCategory(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'by-user') {
    return respond('by-user', aggregateSalesByUser(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'top-products') {
    return respond('top-products', aggregateTopProducts(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'top-customers') {
    return respond('top-customers', aggregateTopCustomers(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'daily-revenue') {
    return respond('daily-revenue', aggregateDailyRevenue(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'monthly-revenue') {
    return respond('monthly-revenue', aggregateMonthlyRevenue(docs) as unknown as Record<string, unknown>[])
  }

  if (reportType === 'csv') {
    const rows = docs.map((d) => ({
      orderNumber: d.orderNumber,
      customer: d.customerName ?? d.customer,
      status: d.status,
      saleDate: d.saleDate,
      total: d.total,
      createdBy: d.createdByName ?? d.createdBy,
    }))
    return respond('export', rows as unknown as Record<string, unknown>[])
  }

  return Response.json({
    type: 'summary',
    totalDocs: result.totalDocs,
    totalAmount: docs.reduce((sum, d) => sum + d.total, 0),
    docs,
  })
}
