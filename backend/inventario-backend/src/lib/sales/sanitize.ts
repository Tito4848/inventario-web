import { normalizeSaleStatus } from './validation'

function relId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string }).id)
  }
  return null
}

function relName(value: unknown, field = 'name'): string {
  if (!value || typeof value !== 'object') return ''
  const rec = value as Record<string, unknown>
  const name = rec[field]
  if (typeof name === 'string') return name
  if (typeof rec.businessName === 'string') return rec.businessName
  if (typeof rec.email === 'string') return rec.email
  return ''
}

export type SanitizedSaleItem = {
  id?: string | null
  product: string
  productName?: string
  productCode?: string
  categoryId?: string
  categoryName?: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

export type SanitizedSale = {
  id: string
  orderNumber: string
  customer: string
  customerName?: string
  status: string
  statusLabel: string
  saleDate: string
  confirmedAt?: string | null
  deliveredAt?: string | null
  subtotal: number
  tax: number
  discountAmount: number
  total: number
  notes?: string | null
  rack?: string | null
  rackName?: string
  createdBy?: string | null
  createdByName?: string
  items: SanitizedSaleItem[]
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
  returned: 'Devuelta',
}

export function sanitizeSale(doc: Record<string, unknown>): SanitizedSale {
  const status = normalizeSaleStatus(String(doc.status ?? 'draft'))
  const itemsRaw = Array.isArray(doc.items) ? doc.items : []

  const items: SanitizedSaleItem[] = itemsRaw.map((raw) => {
    const item = raw as Record<string, unknown>
    const product = item.product
    const productRec = typeof product === 'object' && product !== null ? (product as Record<string, unknown>) : null
    const category = productRec?.category

    return {
      id: item.id != null ? String(item.id) : null,
      product: relId(product) ?? '',
      productName: relName(product),
      productCode: productRec ? String(productRec.code ?? '') : undefined,
      categoryId: relId(category) ?? undefined,
      categoryName: relName(category),
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      discount: Number(item.discount ?? 0),
      total: Number(item.total ?? 0),
    }
  })

  return {
    id: String(doc.id ?? ''),
    orderNumber: String(doc.orderNumber ?? ''),
    customer: relId(doc.customer) ?? '',
    customerName: relName(doc.customer, 'businessName') || relName(doc.customer),
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    saleDate: String(doc.saleDate ?? ''),
    confirmedAt: doc.confirmedAt != null ? String(doc.confirmedAt) : null,
    deliveredAt: doc.deliveredAt != null ? String(doc.deliveredAt) : null,
    subtotal: Number(doc.subtotal ?? 0),
    tax: Number(doc.tax ?? 0),
    discountAmount: Number(doc.discountAmount ?? 0),
    total: Number(doc.total ?? 0),
    notes: doc.notes != null ? String(doc.notes) : null,
    rack: relId(doc.rack),
    rackName: relName(doc.rack, 'name') || relName(doc.rack, 'code'),
    createdBy: relId(doc.createdBy),
    createdByName: relName(doc.createdBy, 'email'),
    items,
    createdAt: String(doc.createdAt ?? ''),
    updatedAt: String(doc.updatedAt ?? ''),
  }
}
