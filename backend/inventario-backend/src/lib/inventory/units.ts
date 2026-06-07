import type { PayloadRequest } from 'payload'

type ID = string

export async function getConversionFactor(params: {
  req: PayloadRequest
  fromUnit: ID
  toUnit: ID
}): Promise<number> {
  const { req, fromUnit, toUnit } = params

  if (fromUnit === toUnit) return 1

  const direct = await req.payload.find({
    collection: 'unit-equivalences',
    where: {
      and: [
        { active: { equals: true } },
        { fromUnit: { equals: fromUnit } },
        { toUnit: { equals: toUnit } },
      ],
    },
    depth: 0,
    limit: 1,
    req,
  })

  if (direct.docs.length) {
    const doc = direct.docs[0] as unknown
    const dr = doc && typeof doc === 'object' ? (doc as Record<string, unknown>) : {}
    const factor = Number(dr.factor ?? 0)
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('Factor de conversión inválido.')
    return factor
  }

  const inverse = await req.payload.find({
    collection: 'unit-equivalences',
    where: {
      and: [
        { active: { equals: true } },
        { fromUnit: { equals: toUnit } },
        { toUnit: { equals: fromUnit } },
      ],
    },
    depth: 0,
    limit: 1,
    req,
  })

  if (inverse.docs.length) {
    const doc = inverse.docs[0] as unknown
    const dr = doc && typeof doc === 'object' ? (doc as Record<string, unknown>) : {}
    const factor = Number(dr.factor ?? 0)
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('Factor de conversión inválido.')
    return 1 / factor
  }

  throw new Error('No existe equivalencia entre unidades para esta operación.')
}

export async function convertQuantity(params: {
  req: PayloadRequest
  quantity: number
  fromUnit: ID
  toUnit: ID
}): Promise<number> {
  const { req, quantity, fromUnit, toUnit } = params
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Cantidad inválida.')
  const factor = await getConversionFactor({ req, fromUnit, toUnit })
  return quantity * factor
}

