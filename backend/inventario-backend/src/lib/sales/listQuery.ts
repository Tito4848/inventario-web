import type { Where } from 'payload'

export type SaleListQuery = {
  page: number
  limit: number
  sort: string
  search?: string
  status?: string
  customer?: string
  createdBy?: string
  from?: string
  to?: string
  product?: string
  category?: string
  pending?: boolean
}

export function parseSaleListQuery(url: URL): SaleListQuery {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20))
  const sort = url.searchParams.get('sort') || '-saleDate'
  const search = url.searchParams.get('search') || undefined
  const status = url.searchParams.get('status') || undefined
  const customer = url.searchParams.get('customer') || undefined
  const createdBy = url.searchParams.get('createdBy') || url.searchParams.get('user') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined
  const product = url.searchParams.get('product') || undefined
  const category = url.searchParams.get('category') || undefined
  const pending = url.searchParams.get('pending') === 'true'

  return { page, limit, sort, search, status, customer, createdBy, from, to, product, category, pending }
}

export function buildSaleListWhere(query: SaleListQuery): Where {
  const conditions: Where[] = []

  if (query.search) {
    conditions.push({ orderNumber: { contains: query.search } })
  }

  if (query.status) {
    conditions.push({ status: { equals: query.status } })
  }

  if (query.pending) {
    conditions.push({ status: { in: ['draft', 'pending'] } })
  }

  if (query.customer) {
    conditions.push({ customer: { equals: query.customer } })
  }

  if (query.createdBy) {
    conditions.push({ createdBy: { equals: query.createdBy } })
  }

  if (query.from) {
    conditions.push({ saleDate: { greater_than_equal: new Date(query.from).toISOString() } })
  }

  if (query.to) {
    const end = new Date(query.to)
    end.setHours(23, 59, 59, 999)
    conditions.push({ saleDate: { less_than_equal: end.toISOString() } })
  }

  if (query.product) {
    conditions.push({ 'items.product': { equals: query.product } })
  }

  if (query.category) {
    conditions.push({ 'items.product.category': { equals: query.category } })
  }

  if (!conditions.length) return {}
  if (conditions.length === 1) return conditions[0]
  return { and: conditions }
}
