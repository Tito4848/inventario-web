import type { Payload } from 'payload'

import type { User } from '@/payload-types'

export type PurchaseStats = {
  dailyCount: number
  monthlyCount: number
  monthlyAmount: number
  pendingOrders: number
  receivedOrders: number
  partialOrders: number
  topSupplier?: { id: string; name: string; count: number; amount: number } | null
  topProducts: Array<{ id: string; name: string; quantity: number }>
}

function relId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return ''
}

export async function computePurchaseStats(payload: Payload, user: User): Promise<PurchaseStats> {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { docs } = await payload.find({
    collection: 'purchase-orders',
    limit: 5000,
    depth: 1,
    overrideAccess: false,
    user,
  })

  let dailyCount = 0
  let monthlyCount = 0
  let monthlyAmount = 0
  let pendingOrders = 0
  let receivedOrders = 0
  let partialOrders = 0

  const supplierAgg = new Map<string, { name: string; count: number; amount: number }>()
  const productAgg = new Map<string, { name: string; quantity: number }>()

  for (const raw of docs) {
    const doc = raw as unknown as Record<string, unknown>
    const orderDate = new Date(String(doc.orderDate ?? doc.createdAt ?? ''))
    const status = String(doc.status ?? '')
    const total = Number(doc.total ?? 0)

    if (orderDate >= todayStart) dailyCount += 1
    if (orderDate >= monthStart) {
      monthlyCount += 1
      monthlyAmount += total
    }

    if (status === 'pending' || status === 'sent' || status === 'draft') pendingOrders += 1
    if (status === 'received' || status === 'invoiced') receivedOrders += 1
    if (status === 'partial') partialOrders += 1

    const supplierId = relId(doc.supplier)
    if (supplierId) {
      const supplierName =
        typeof doc.supplier === 'object' && doc.supplier !== null
          ? String((doc.supplier as { businessName?: string; name?: string }).businessName ??
              (doc.supplier as { name?: string }).name ??
              supplierId)
          : supplierId
      const prev = supplierAgg.get(supplierId) ?? { name: supplierName, count: 0, amount: 0 }
      prev.count += 1
      prev.amount += total
      supplierAgg.set(supplierId, prev)
    }

    const items = Array.isArray(doc.items) ? doc.items : []
    for (const item of items) {
      const row = item as Record<string, unknown>
      const productId = relId(row.product)
      if (!productId) continue
      const productName =
        typeof row.product === 'object' && row.product !== null
          ? String((row.product as { name?: string }).name ?? productId)
          : productId
      const qty = Number(row.quantity ?? 0)
      const prev = productAgg.get(productId) ?? { name: productName, quantity: 0 }
      prev.quantity += qty
      productAgg.set(productId, prev)
    }
  }

  let topSupplier: PurchaseStats['topSupplier'] = null
  for (const [id, data] of supplierAgg) {
    if (!topSupplier || data.count > topSupplier.count) {
      topSupplier = { id, name: data.name, count: data.count, amount: data.amount }
    }
  }

  const topProducts = [...productAgg.entries()]
    .map(([id, data]) => ({ id, name: data.name, quantity: data.quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return {
    dailyCount,
    monthlyCount,
    monthlyAmount,
    pendingOrders,
    receivedOrders,
    partialOrders,
    topSupplier,
    topProducts,
  }
}
