import type { Payload } from 'payload'

import type { User } from '@/payload-types'

import type { SanitizedSale } from './sanitize'

export type SaleStats = {
  dailyCount: number
  monthlyCount: number
  monthlyRevenue: number
  dailyRevenue: number
  pendingOrders: number
  confirmedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  topCustomer?: { id: string; name: string; count: number; amount: number } | null
  topProducts: Array<{ id: string; name: string; quantity: number; amount: number }>
}

const REVENUE_STATUSES = new Set(['delivered', 'returned'])

export async function computeSaleStats(payload: Payload, user: User): Promise<SaleStats> {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { docs } = await payload.find({
    collection: 'sales-orders',
    limit: 5000,
    depth: 1,
    overrideAccess: false,
    user,
  })

  let dailyCount = 0
  let monthlyCount = 0
  let monthlyRevenue = 0
  let dailyRevenue = 0
  let pendingOrders = 0
  let confirmedOrders = 0
  let deliveredOrders = 0
  let cancelledOrders = 0

  const customerAgg = new Map<string, { name: string; count: number; amount: number }>()
  const productAgg = new Map<string, { name: string; quantity: number; amount: number }>()

  for (const raw of docs) {
    const doc = raw as unknown as Record<string, unknown>
    const saleDate = new Date(String(doc.saleDate ?? doc.createdAt ?? ''))
    const status = String(doc.status ?? '')
    const total = Number(doc.total ?? 0)
    const countsRevenue = REVENUE_STATUSES.has(status)

    if (saleDate >= todayStart) {
      dailyCount += 1
      if (countsRevenue) dailyRevenue += total
    }
    if (saleDate >= monthStart) {
      monthlyCount += 1
      if (countsRevenue) monthlyRevenue += total
    }

    if (status === 'draft' || status === 'pending') pendingOrders += 1
    if (status === 'confirmed') confirmedOrders += 1
    if (status === 'delivered') deliveredOrders += 1
    if (status === 'cancelled') cancelledOrders += 1

    if (!countsRevenue) continue

    const customerId =
      typeof doc.customer === 'object' && doc.customer !== null
        ? String((doc.customer as { id: string }).id)
        : String(doc.customer ?? '')
    if (customerId) {
      const customerName =
        typeof doc.customer === 'object' && doc.customer !== null
          ? String(
              (doc.customer as { businessName?: string; name?: string }).businessName ??
                (doc.customer as { name?: string }).name ??
                customerId,
            )
          : customerId
      const prev = customerAgg.get(customerId) ?? { name: customerName, count: 0, amount: 0 }
      prev.count += 1
      prev.amount += total
      customerAgg.set(customerId, prev)
    }

    const items = Array.isArray(doc.items) ? doc.items : []
    for (const item of items) {
      const row = item as Record<string, unknown>
      const productId =
        typeof row.product === 'object' && row.product !== null
          ? String((row.product as { id: string }).id)
          : String(row.product ?? '')
      if (!productId) continue
      const productName =
        typeof row.product === 'object' && row.product !== null
          ? String((row.product as { name?: string }).name ?? productId)
          : productId
      const qty = Number(row.quantity ?? 0)
      const lineTotal = Number(row.total ?? 0)
      const prev = productAgg.get(productId) ?? { name: productName, quantity: 0, amount: 0 }
      prev.quantity += qty
      prev.amount += lineTotal
      productAgg.set(productId, prev)
    }
  }

  let topCustomer: SaleStats['topCustomer'] = null
  for (const [id, data] of customerAgg) {
    if (!topCustomer || data.count > topCustomer.count) {
      topCustomer = { id, name: data.name, count: data.count, amount: data.amount }
    }
  }

  const topProducts = [...productAgg.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    dailyCount,
    monthlyCount,
    monthlyRevenue,
    dailyRevenue,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
    cancelledOrders,
    topCustomer,
    topProducts,
  }
}

export function aggregateSalesByDate(docs: SanitizedSale[]) {
  const grouped = new Map<string, { date: string; count: number; total: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    const dateKey = doc.saleDate.slice(0, 10)
    const prev = grouped.get(dateKey) ?? { date: dateKey, count: 0, total: 0 }
    prev.count += 1
    prev.total += doc.total
    grouped.set(dateKey, prev)
  }
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function aggregateSalesByCustomer(docs: SanitizedSale[]) {
  const grouped = new Map<string, { customerId: string; customerName: string; count: number; total: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    const key = doc.customer
    const prev = grouped.get(key) ?? { customerId: key, customerName: doc.customerName ?? key, count: 0, total: 0 }
    prev.count += 1
    prev.total += doc.total
    grouped.set(key, prev)
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total)
}

export function aggregateSalesByProduct(docs: SanitizedSale[]) {
  const grouped = new Map<string, { productId: string; productName: string; quantity: number; amount: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    for (const item of doc.items) {
      const prev = grouped.get(item.product) ?? {
        productId: item.product,
        productName: item.productName ?? item.product,
        quantity: 0,
        amount: 0,
      }
      prev.quantity += item.quantity
      prev.amount += item.total
      grouped.set(item.product, prev)
    }
  }
  return [...grouped.values()].sort((a, b) => b.amount - a.amount)
}

export function aggregateSalesByCategory(docs: SanitizedSale[]) {
  const grouped = new Map<string, { categoryId: string; categoryName: string; quantity: number; amount: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    for (const item of doc.items) {
      const categoryId = item.categoryId ?? 'unknown'
      const prev = grouped.get(categoryId) ?? {
        categoryId,
        categoryName: item.categoryName ?? categoryId,
        quantity: 0,
        amount: 0,
      }
      prev.quantity += item.quantity
      prev.amount += item.total
      grouped.set(categoryId, prev)
    }
  }
  return [...grouped.values()].sort((a, b) => b.amount - a.amount)
}

export function aggregateSalesByUser(docs: SanitizedSale[]) {
  const grouped = new Map<string, { userId: string; userName: string; count: number; total: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    const key = doc.createdBy ?? 'unknown'
    const prev = grouped.get(key) ?? { userId: key, userName: doc.createdByName ?? key, count: 0, total: 0 }
    prev.count += 1
    prev.total += doc.total
    grouped.set(key, prev)
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total)
}

export function aggregateTopProducts(docs: SanitizedSale[], limit = 10) {
  return aggregateSalesByProduct(docs).slice(0, limit)
}

export function aggregateTopCustomers(docs: SanitizedSale[], limit = 10) {
  return aggregateSalesByCustomer(docs).slice(0, limit)
}

export function aggregateDailyRevenue(docs: SanitizedSale[]) {
  return aggregateSalesByDate(docs).map((row) => ({
    date: row.date,
    revenue: row.total,
    orders: row.count,
  }))
}

export function aggregateMonthlyRevenue(docs: SanitizedSale[]) {
  const grouped = new Map<string, { month: string; revenue: number; orders: number }>()
  for (const doc of docs) {
    if (!REVENUE_STATUSES.has(doc.status)) continue
    const monthKey = doc.saleDate.slice(0, 7)
    const prev = grouped.get(monthKey) ?? { month: monthKey, revenue: 0, orders: 0 }
    prev.revenue += doc.total
    prev.orders += 1
    grouped.set(monthKey, prev)
  }
  return [...grouped.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function salesReportToCsv(type: string, rows: Record<string, unknown>[]): string {
  if (!rows.length) return `${type}\n`
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}
