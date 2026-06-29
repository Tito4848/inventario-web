import type { Where } from 'payload'

export type PurchaseListQuery = {
  page: number
  limit: number
  sort: string
  search?: string
  status?: string
  supplier?: string
  createdBy?: string
  from?: string
  to?: string
  product?: string
  pending?: boolean
}

export function parsePurchaseListQuery(url: URL): PurchaseListQuery {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
  const sort = url.searchParams.get('sort') || '-orderDate'
  const search = url.searchParams.get('search') || undefined
  const status = url.searchParams.get('status') || undefined
  const supplier = url.searchParams.get('supplier') || undefined
  const createdBy = url.searchParams.get('createdBy') || url.searchParams.get('user') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined
  const product = url.searchParams.get('product') || undefined
  const pending = url.searchParams.get('pending') === 'true'

  return { page, limit, sort, search, status, supplier, createdBy, from, to, product, pending }
}

export function buildPurchaseListWhere(query: PurchaseListQuery): Where {
  const conditions: Where[] = []

  if (query.search) {
    conditions.push({ orderNumber: { contains: query.search } })
  }

  if (query.status) {
    if (query.status === 'pending') {
      conditions.push({ status: { in: ['pending', 'sent'] } })
    } else {
      conditions.push({ status: { equals: query.status } })
    }
  }

  if (query.pending) {
    conditions.push({ status: { in: ['pending', 'sent', 'partial'] } })
  }

  if (query.supplier) {
    conditions.push({ supplier: { equals: query.supplier } })
  }

  if (query.createdBy) {
    conditions.push({ createdBy: { equals: query.createdBy } })
  }

  if (query.from) {
    conditions.push({ orderDate: { greater_than_equal: new Date(query.from).toISOString() } })
  }

  if (query.to) {
    const end = new Date(query.to)
    end.setHours(23, 59, 59, 999)
    conditions.push({ orderDate: { less_than_equal: end.toISOString() } })
  }

  if (query.product) {
    conditions.push({ 'items.product': { equals: query.product } })
  }

  if (!conditions.length) return {}
  if (conditions.length === 1) return conditions[0]
  return { and: conditions }
}
