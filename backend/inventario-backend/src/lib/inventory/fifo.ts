import type { PayloadRequest } from 'payload'

type ID = string

export type FifoAllocation = {
  lot: ID
  qtyBase: number
  unitCostBase: number
  value: number
}

export async function allocateFIFO(params: {
  req: PayloadRequest
  product: ID
  rack: ID
  qtyOutBase: number
}): Promise<{ allocations: FifoAllocation[]; totalValue: number }> {
  const { req, product, rack, qtyOutBase } = params

  if (!Number.isFinite(qtyOutBase) || qtyOutBase <= 0) throw new Error('Cantidad de salida inválida.')

  let remaining = qtyOutBase
  const allocations: FifoAllocation[] = []

  const asRecord = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null)

  while (remaining > 0) {
    const lots = await req.payload.find({
      collection: 'stock-lots',
      where: {
        and: [
          { product: { equals: product } },
          { rack: { equals: rack } },
          { qtyRemainingBase: { greater_than: 0 } },
        ],
      },
      sort: 'receivedAt',
      limit: 25,
      depth: 0,
      req,
    })

    if (!lots.docs.length) break

    let progressed = false

    for (const lot of lots.docs as unknown[]) {
      const lr = asRecord(lot)
      if (!lr) continue

      const lotId = String(lr.id ?? '')
      const lotRemaining = Number(lr.qtyRemainingBase ?? 0)
      const unitCostBase = Number(lr.unitCostBase ?? 0)

      if (!Number.isFinite(lotRemaining) || lotRemaining <= 0) continue
      if (!Number.isFinite(unitCostBase) || unitCostBase < 0) throw new Error('Lote con costo inválido.')

      const take = Math.min(lotRemaining, remaining)
      const newRemaining = lotRemaining - take

      await req.payload.update({
        collection: 'stock-lots',
        id: lotId,
        data: { qtyRemainingBase: newRemaining },
        depth: 0,
        req,
      })

      const value = take * unitCostBase
      allocations.push({
        lot: lotId,
        qtyBase: take,
        unitCostBase,
        value,
      })

      remaining -= take
      progressed = true

      if (remaining <= 0) break
    }

    if (!progressed) break
  }

  if (remaining > 0) {
    throw new Error('Stock insuficiente para completar la salida (FIFO).')
  }

  const totalValue = allocations.reduce((acc, a) => acc + a.value, 0)
  return { allocations, totalValue }
}

