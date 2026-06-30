import type { PayloadRequest } from 'payload'

import { convertQuantity } from '@/lib/inventory/units'

function relId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return String((value as { id: string }).id)
  return ''
}

export type StockCheckLine = {
  product: string
  quantity: number
  unit: string
}

export async function checkStockAvailability(params: {
  req: PayloadRequest
  rackId: string
  lines: StockCheckLine[]
}): Promise<string | null> {
  const { req, rackId, lines } = params

  const rackExists = await req.payload
    .findByID({
      collection: 'racks',
      id: rackId,
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null)
  if (!rackExists) return 'Rack no encontrado.'

  for (const line of lines) {
    const product = await req.payload
      .findByID({
        collection: 'products',
        id: line.product,
        depth: 0,
        overrideAccess: true,
        req,
      })
      .catch(() => null)

    if (!product) return `Producto ${line.product} no existe.`

    const pr = product as unknown as Record<string, unknown>
    if (Boolean(pr.allowNegativeStock)) continue

    const baseUnitId = relId(pr.baseUnit)
    if (!baseUnitId) return `El producto ${line.product} no tiene unidad base configurada.`

    const qtyBase = await convertQuantity({
      req,
      quantity: line.quantity,
      fromUnit: line.unit,
      toUnit: baseUnitId,
    })

    const level = await req.payload.find({
      collection: 'stock-levels',
      where: {
        and: [{ product: { equals: line.product } }, { rack: { equals: rackId } }],
      },
      depth: 0,
      limit: 1,
      req,
    })

    const available = level.docs.length
      ? Number((level.docs[0] as { quantityBase?: number }).quantityBase ?? 0)
      : 0

    if (available < qtyBase) {
      const productName = typeof pr.name === 'string' ? pr.name : line.product
      return `Stock insuficiente para ${productName} en el rack seleccionado (disponible: ${available.toFixed(4)}).`
    }
  }

  return null
}
