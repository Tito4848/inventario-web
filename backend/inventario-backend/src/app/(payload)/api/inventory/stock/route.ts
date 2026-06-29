import type { Where } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canReadInventory } from '@/access/roles'
import {
  asRecord,
  computeStockStatus,
  getProductId,
  num,
  type StockStatus,
} from '@/lib/inventory/helpers'

type StockRow = Record<string, unknown> & {
  quantityBase: number
  value: number
  minStockBase: number
  maxStockBase: number | null
  reservedQtyBase: number
  availableQtyBase: number
  stockStatus: StockStatus
  isBelowMin: boolean
  isOutOfStock: boolean
}

function enrichLevel(level: unknown): StockRow {
  const lr = asRecord(level) || {}
  const p = asRecord(lr.product)
  const min = num(p?.minStockBase, 0)
  const maxRaw = p?.maxStockBase
  const max = maxRaw != null && maxRaw !== '' ? num(maxRaw, 0) : null
  const qty = num(lr.quantityBase, 0)
  const reserved = num(lr.reservedQtyBase, 0)
  const available = Math.max(0, qty - reserved)
  const status = computeStockStatus(qty, min, max)

  return {
    ...(lr as object),
    quantityBase: qty,
    value: num(lr.value, 0),
    minStockBase: min,
    maxStockBase: max,
    reservedQtyBase: reserved,
    availableQtyBase: available,
    stockStatus: status,
    isBelowMin: qty > 0 && qty <= min,
    isOutOfStock: qty <= 0,
  }
}

function aggregateByProduct(levels: StockRow[]): StockRow[] {
  const map = new Map<string, StockRow>()

  for (const row of levels) {
    const productId = getProductId(row.product)
    if (!productId) continue

    const existing = map.get(productId)
    if (!existing) {
      map.set(productId, {
        ...row,
        id: `agg-${productId}`,
        rack: null,
        quantityBase: row.quantityBase,
        value: row.value,
        reservedQtyBase: row.reservedQtyBase,
        availableQtyBase: row.availableQtyBase,
      })
      continue
    }

    existing.quantityBase += row.quantityBase
    existing.value += row.value
    existing.reservedQtyBase += row.reservedQtyBase
    existing.availableQtyBase += row.availableQtyBase
    existing.isBelowMin = existing.quantityBase > 0 && existing.quantityBase <= existing.minStockBase
    existing.isOutOfStock = existing.quantityBase <= 0
    existing.stockStatus = computeStockStatus(
      existing.quantityBase,
      existing.minStockBase,
      existing.maxStockBase,
    )
  }

  return Array.from(map.values())
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!canReadInventory(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const product = url.searchParams.get('product') || undefined
  const rack = url.searchParams.get('rack') || undefined
  const category = url.searchParams.get('category') || undefined
  const belowMin = url.searchParams.get('belowMin') === 'true'
  const outOfStock = url.searchParams.get('outOfStock') === 'true'
  const aggregate = url.searchParams.get('aggregate') === 'product'
  const statusFilter = url.searchParams.get('status') as StockStatus | null

  const and: Where[] = []
  if (product) and.push({ product: { equals: product } })
  if (rack) and.push({ rack: { equals: rack } })

  if (category) {
    const productsInCategory = await payload.find({
      collection: 'products',
      where: { category: { equals: category } },
      depth: 0,
      limit: 500,
      user,
      overrideAccess: false,
    })
    const ids = productsInCategory.docs.map((p) => String(p.id))
    if (!ids.length) {
      return Response.json({ docs: [], totalDocs: 0, limit: 200, page: 1, totalPages: 0 })
    }
    and.push({ product: { in: ids } })
  }

  const where: Where | undefined = and.length ? { and } : undefined

  const levels = await payload.find({
    collection: 'stock-levels',
    where,
    depth: 3,
    limit: 500,
    sort: '-updatedAt',
    user,
    overrideAccess: false,
  })

  let docs = (levels.docs as unknown[]).map(enrichLevel)

  if (aggregate) {
    docs = aggregateByProduct(docs)
  }

  if (belowMin) docs = docs.filter((d) => d.isBelowMin || d.isOutOfStock)
  if (outOfStock) docs = docs.filter((d) => d.isOutOfStock)
  if (statusFilter) docs = docs.filter((d) => d.stockStatus === statusFilter)

  return Response.json({
    ...levels,
    docs,
    totalDocs: docs.length,
  })
}
