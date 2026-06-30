import type { Payload, PayloadRequest } from 'payload'

export async function generateSaleOrderNumber(
  reqOrPayload: PayloadRequest | Payload,
): Promise<string> {
  const payload = 'payload' in reqOrPayload ? reqOrPayload.payload : reqOrPayload
  const req = 'payload' in reqOrPayload ? reqOrPayload : undefined
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `VT-${datePart}-`

  const latest = await payload.find({
    collection: 'sales-orders',
    where: { orderNumber: { contains: prefix } },
    sort: '-orderNumber',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  let seq = 1
  if (latest.docs.length) {
    const last = String((latest.docs[0] as { orderNumber?: string }).orderNumber ?? '')
    const tail = last.slice(prefix.length)
    const parsed = Number.parseInt(tail, 10)
    if (Number.isFinite(parsed)) seq = parsed + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
