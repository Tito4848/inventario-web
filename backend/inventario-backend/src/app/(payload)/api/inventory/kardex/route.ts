import type { Where } from 'payload'
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
  const product = url.searchParams.get('product')
  const rack = url.searchParams.get('rack') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined

  if (!product) {
    return Response.json({ error: 'Missing product' }, { status: 400 })
  }

  const and: Where[] = [{ product: { equals: product } }]
  if (rack) and.push({ rack: { equals: rack } })
  if (from) and.push({ date: { greater_than_equal: from } })
  if (to) and.push({ date: { less_than_equal: to } })

  const res = await payload.find({
    collection: 'stock-movements',
    where: { and },
    sort: 'date',
    depth: 2,
    limit: 500,
    user,
    overrideAccess: false,
  })

  let runningQty = 0
  let runningValue = 0

  const rows = (res.docs as unknown[]).map((m) => {
    const mr = m as Record<string, unknown>
    const type = String(mr.movementType)
    const qtyBase = Number(mr.quantityBase ?? 0)
    const value = Number(mr.totalValue ?? 0)

    const inQty = type === 'in' || type === 'adjust_in' ? qtyBase : 0
    const outQty = type === 'out' || type === 'adjust_out' ? qtyBase : 0
    const inValue = type === 'in' || type === 'adjust_in' ? value : 0
    const outValue = type === 'out' || type === 'adjust_out' ? value : 0

    runningQty = runningQty + inQty - outQty
    runningValue = runningValue + inValue - outValue

    return {
      ...(m as object),
      inQty,
      outQty,
      balanceQty: runningQty,
      inValue,
      outValue,
      balanceValue: runningValue,
    }
  })

  return Response.json({
    ...res,
    docs: rows,
  })
}

