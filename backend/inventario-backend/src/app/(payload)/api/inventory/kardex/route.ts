import type { Where } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canReadInventory } from '@/access/roles'
import {
  asRecord,
  isInboundMovement,
  isOutboundMovement,
  MOVEMENT_TYPE_LABELS,
  num,
} from '@/lib/inventory/helpers'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!canReadInventory(user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const product = url.searchParams.get('product')
  const rack = url.searchParams.get('rack') || undefined
  const category = url.searchParams.get('category') || undefined
  const movementType = url.searchParams.get('movementType') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined

  if (!product && !category) {
    return Response.json({ error: 'Missing product or category' }, { status: 400 })
  }

  const and: Where[] = []

  if (product) {
    and.push({ product: { equals: product } })
  } else if (category) {
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
      return Response.json({ docs: [], totalDocs: 0, limit: 500, page: 1, totalPages: 0 })
    }
    and.push({ product: { in: ids } })
  }

  if (rack) and.push({ rack: { equals: rack } })
  if (movementType) and.push({ movementType: { equals: movementType } })
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

  const runningByProduct = new Map<string, { qty: number; value: number }>()

  const rows = (res.docs as unknown[]).map((m) => {
    const mr = asRecord(m) || {}
    const type = String(mr.movementType)
    const qtyBase = num(mr.quantityBase, 0)
    const value = num(mr.totalValue, 0)
    const productId = String(mr.product ?? '')

    const inQty = isInboundMovement(type) ? qtyBase : 0
    const outQty = isOutboundMovement(type) ? qtyBase : 0
    const inValue = isInboundMovement(type) ? value : 0
    const outValue = isOutboundMovement(type) ? value : 0

    const state = runningByProduct.get(productId) ?? { qty: 0, value: 0 }
    const previousQty = state.qty
    const previousValue = state.value

    state.qty = state.qty + inQty - outQty
    state.value = state.value + inValue - outValue
    runningByProduct.set(productId, state)

    const createdBy = asRecord(mr.createdBy)
    const document = String(mr.label ?? '')
    const notes = mr.notes ? String(mr.notes) : ''

    return {
      ...(m as object),
      movementTypeLabel: MOVEMENT_TYPE_LABELS[type] ?? type,
      inQty,
      outQty,
      previousQty,
      previousValue,
      balanceQty: state.qty,
      newQty: state.qty,
      inValue,
      outValue,
      balanceValue: state.value,
      document,
      notes,
      createdByName: createdBy?.email ? String(createdBy.email) : createdBy?.fullName ? String(createdBy.fullName) : '',
    }
  })

  const sortedRows = product
    ? rows
    : [...rows].sort((a, b) => {
        const aRec = asRecord(a)
        const bRec = asRecord(b)
        const aDate = String(aRec?.date ?? '')
        const bDate = String(bRec?.date ?? '')
        return aDate.localeCompare(bDate)
      })

  return Response.json({
    ...res,
    docs: sortedRows,
  })
}
