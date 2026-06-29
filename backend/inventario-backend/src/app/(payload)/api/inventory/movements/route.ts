import type { Where } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canReadInventory } from '@/access/roles'
import { asRecord, MOVEMENT_TYPE_LABELS, num } from '@/lib/inventory/helpers'

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
  const movementType = url.searchParams.get('movementType') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 100)))

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
      return Response.json({ docs: [], totalDocs: 0, limit, page, totalPages: 0 })
    }
    and.push({ product: { in: ids } })
  }

  if (rack) and.push({ rack: { equals: rack } })
  if (movementType) and.push({ movementType: { equals: movementType } })
  if (from) and.push({ date: { greater_than_equal: from } })
  if (to) and.push({ date: { less_than_equal: to } })

  const where: Where | undefined = and.length ? { and } : undefined

  const res = await payload.find({
    collection: 'stock-movements',
    where,
    sort: '-date',
    depth: 2,
    limit,
    page,
    user,
    overrideAccess: false,
  })

  const docs = (res.docs as unknown[]).map((m) => {
    const mr = asRecord(m) || {}
    const type = String(mr.movementType)
    const createdBy = asRecord(mr.createdBy)
    const productRec = asRecord(mr.product)
    const rackRec = asRecord(mr.rack)

    return {
      id: String(mr.id ?? ''),
      date: String(mr.date ?? ''),
      movementType: type,
      movementTypeLabel: MOVEMENT_TYPE_LABELS[type] ?? type,
      label: String(mr.label ?? ''),
      notes: mr.notes ? String(mr.notes) : '',
      document: String(mr.label ?? ''),
      product: mr.product,
      productName: productRec?.name ? String(productRec.name) : '',
      productCode: productRec?.code ? String(productRec.code) : '',
      rack: mr.rack,
      rackName: rackRec?.name ? String(rackRec.name) : '',
      quantity: num(mr.quantity, 0),
      quantityBase: num(mr.quantityBase, 0),
      unitCostBase: num(mr.unitCostBase, 0),
      totalValue: num(mr.totalValue, 0),
      createdBy: mr.createdBy,
      createdByName: createdBy?.email
        ? String(createdBy.email)
        : createdBy?.fullName
          ? String(createdBy.fullName)
          : '',
    }
  })

  return Response.json({
    ...res,
    docs,
  })
}
