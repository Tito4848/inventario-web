import { normalizePurchaseStatus } from './validation'

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

export type SanitizedPurchaseItem = {
  id?: string | null
  product: string
  productName?: string
  productCode?: string
  quantity: number
  quantityReceived: number
  unitCost: number
  discount: number
  total: number
  pendingQuantity: number
}

export type SanitizedReception = {
  id?: string | null
  date: string
  receivedBy?: string | null
  receivedByName?: string
  notes?: string | null
  items?: Array<{ product: string; productName?: string; quantity: number }>
}

export type SanitizedPurchase = {
  id: string
  orderNumber: string
  supplier: string
  supplierName?: string
  status: string
  statusLabel: string
  orderDate: string
  receivedDate?: string | null
  currency: string
  subtotal: number
  tax: number
  discount: number
  total: number
  notes?: string | null
  rack?: string | null
  rackName?: string
  createdBy?: string | null
  createdByName?: string
  items: SanitizedPurchaseItem[]
  receptions: SanitizedReception[]
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  sent: 'Pendiente',
  partial: 'Parcial',
  received: 'Recibida',
  invoiced: 'Recibida',
  cancelled: 'Cancelada',
}

export function sanitizePurchase(doc: Record<string, unknown>): SanitizedPurchase {
  const status = normalizePurchaseStatus(String(doc.status ?? 'draft'))
  const itemsRaw = Array.isArray(doc.items) ? doc.items : []

  const items: SanitizedPurchaseItem[] = itemsRaw.map((raw) => {
    const item = raw as Record<string, unknown>
    const quantity = Number(item.quantity ?? 0)
    const quantityReceived = Number(item.quantityReceived ?? 0)
    return {
      id: item.id != null ? String(item.id) : null,
      product: relId(item.product) ?? '',
      productName: relName(item.product),
      productCode:
        typeof item.product === 'object' && item.product !== null
          ? String((item.product as { code?: string }).code ?? '')
          : undefined,
      quantity,
      quantityReceived,
      unitCost: Number(item.unitCost ?? 0),
      discount: Number(item.discount ?? 0),
      total: Number(item.total ?? 0),
      pendingQuantity: Math.max(0, quantity - quantityReceived),
    }
  })

  const receptionsRaw = Array.isArray(doc.receptions) ? doc.receptions : []
  const receptions: SanitizedReception[] = receptionsRaw.map((raw) => {
    const rec = raw as Record<string, unknown>
    const recItems = Array.isArray(rec.items) ? rec.items : []
    return {
      id: rec.id != null ? String(rec.id) : null,
      date: String(rec.date ?? ''),
      receivedBy: relId(rec.receivedBy),
      receivedByName: relName(rec.receivedBy, 'email'),
      notes: rec.notes != null ? String(rec.notes) : null,
      items: recItems.map((ri) => {
        const row = ri as Record<string, unknown>
        return {
          product: relId(row.product) ?? '',
          productName: relName(row.product),
          quantity: Number(row.quantity ?? 0),
        }
      }),
    }
  })

  return {
    id: String(doc.id ?? ''),
    orderNumber: String(doc.orderNumber ?? ''),
    supplier: relId(doc.supplier) ?? '',
    supplierName: relName(doc.supplier, 'businessName') || relName(doc.supplier),
    status,
    statusLabel: STATUS_LABELS[status] ?? status,
    orderDate: String(doc.orderDate ?? ''),
    receivedDate: doc.receivedDate != null ? String(doc.receivedDate) : null,
    currency: String(doc.currency ?? 'PEN'),
    subtotal: Number(doc.subtotal ?? 0),
    tax: Number(doc.tax ?? 0),
    discount: Number(doc.discount ?? 0),
    total: Number(doc.total ?? 0),
    notes: doc.notes != null ? String(doc.notes) : null,
    rack: relId(doc.rack),
    rackName: relName(doc.rack, 'name') || relName(doc.rack, 'code'),
    createdBy: relId(doc.createdBy),
    createdByName: relName(doc.createdBy, 'email'),
    items,
    receptions,
    createdAt: String(doc.createdAt ?? ''),
    updatedAt: String(doc.updatedAt ?? ''),
  }
}
