import type { PayloadRequest } from 'payload'

type ID = string

export async function upsertStockLevel(params: {
  req: PayloadRequest
  product: ID
  rack: ID
  deltaQtyBase: number
  deltaValue: number
}): Promise<void> {
  const { req, product, rack, deltaQtyBase, deltaValue } = params

  if (!Number.isFinite(deltaQtyBase) || !Number.isFinite(deltaValue)) {
    throw new Error('Delta inválido para stock.')
  }

  const existing = await req.payload.find({
    collection: 'stock-levels',
    where: { and: [{ product: { equals: product } }, { rack: { equals: rack } }] },
    depth: 0,
    limit: 1,
    req,
  })

  if (!existing.docs.length) {
    await req.payload.create({
      collection: 'stock-levels',
      data: {
        label: `${product} @ ${rack}`,
        product,
        rack,
        quantityBase: deltaQtyBase,
        value: deltaValue,
      },
      depth: 0,
      req,
    })
    return
  }

  const level = existing.docs[0] as unknown
  const lr = level && typeof level === 'object' ? (level as Record<string, unknown>) : {}
  const id = String(lr.id ?? '')
  const nextQty = Number(lr.quantityBase ?? 0) + deltaQtyBase
  const nextValue = Number(lr.value ?? 0) + deltaValue

  await req.payload.update({
    collection: 'stock-levels',
    id,
    data: {
      quantityBase: nextQty,
      value: nextValue,
    },
    depth: 0,
    req,
  })
}

