import type { Where } from 'payload'

export type ProductListQuery = {
  page: number
  limit: number
  sort: string
  search?: string
  status?: string
  category?: string
  subcategory?: string
  brand?: string
  supplier?: string
  active?: string
}

export function parseProductListQuery(url: URL): ProductListQuery {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 10)))
  const sort = url.searchParams.get('sort') || '-createdAt'
  const search = url.searchParams.get('search')?.trim() || undefined
  const status = url.searchParams.get('status')?.trim() || undefined
  const category = url.searchParams.get('category')?.trim() || undefined
  const subcategory = url.searchParams.get('subcategory')?.trim() || undefined
  const brand = url.searchParams.get('brand')?.trim() || undefined
  const supplier = url.searchParams.get('supplier')?.trim() || undefined
  const active = url.searchParams.get('active')?.trim() || undefined

  return { page, limit, sort, search, status, category, subcategory, brand, supplier, active }
}

export function buildProductListWhere(query: ProductListQuery): Where {
  const conditions: Where[] = []

  if (query.search) {
    conditions.push({
      or: [
        { name: { contains: query.search } },
        { code: { contains: query.search } },
        { barcode: { contains: query.search } },
        { description: { contains: query.search } },
      ],
    })
  }

  if (query.status) {
    conditions.push({ status: { equals: query.status } })
  }

  if (query.category) {
    conditions.push({ category: { equals: query.category } })
  }

  if (query.subcategory) {
    conditions.push({ subcategory: { equals: query.subcategory } })
  }

  if (query.brand) {
    conditions.push({ brand: { equals: query.brand } })
  }

  if (query.supplier) {
    conditions.push({ supplier: { equals: query.supplier } })
  }

  if (query.active === 'true') {
    conditions.push({ active: { equals: true } })
  } else if (query.active === 'false') {
    conditions.push({ active: { equals: false } })
  }

  if (!conditions.length) return {}
  if (conditions.length === 1) return conditions[0]
  return { and: conditions }
}
