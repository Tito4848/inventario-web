import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canReadInventory } from '@/access/roles'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!canReadInventory(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const product = url.searchParams.get('product') || undefined
  const rack = url.searchParams.get('rack') || undefined
  const belowMin = url.searchParams.get('belowMin') === 'true'

  const and: Record<string, unknown>[] = []
  if (product) and.push({ product: { equals: product } })
  if (rack) and.push({ rack: { equals: rack } })
  const where = and.length ? ({ and } as const) : undefined

  const levels = await payload.find({
    collection: 'stock-levels',
    where,
    depth: 3,
    limit: 200,
    sort: '-updatedAt',
    user,
    overrideAccess: false,
  })

  const docs = (levels.docs as unknown[]).map((l) => {
    const lr = l as Record<string, unknown>
    const p = (lr.product as Record<string, unknown> | null) || null
    const min = Number(p?.minStockBase ?? 0)
    const qty = Number(lr.quantityBase ?? 0)
    return {
      ...(l as object),
      isBelowMin: qty < min,
      minStockBase: min,
    }
  })

  return Response.json({
    ...levels,
    docs: belowMin ? docs.filter((d) => d.isBelowMin) : docs,
  })
}

