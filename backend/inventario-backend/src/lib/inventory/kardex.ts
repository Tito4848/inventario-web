import type { PayloadRequest } from 'payload'

type ID = string

export async function createKardexEntry(params: {
  req: PayloadRequest
  product: ID
  rack: ID
  movementId: ID
  lotId?: ID
  entryType: 'in' | 'out'
  quantityBase: number
  unitCostBase: number
  value: number
  balanceQtyBase: number
  balanceValue: number
  occurredAt: string
}): Promise<void> {
  const { req, product, rack, movementId, lotId, entryType, quantityBase, unitCostBase, value, balanceQtyBase, balanceValue, occurredAt } = params

  await req.payload.create({
    collection: 'kardex-entries',
    data: {
      label: `${entryType === 'in' ? 'Entrada' : 'Salida'} ${product}`,
      product,
      rack,
      movement: movementId,
      lot: lotId,
      entryType,
      quantityBase,
      unitCostBase,
      value,
      balanceQtyBase,
      balanceValue,
      occurredAt,
    },
    depth: 0,
    req,
  })
}
