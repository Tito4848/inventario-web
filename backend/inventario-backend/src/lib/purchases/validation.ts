export const PURCHASE_STATUSES = [
  'draft',
  'pending',
  'partial',
  'received',
  'cancelled',
] as const

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

type ParseIssue = { message: string }
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: ParseIssue[] } }

export type PurchaseItemInput = {
  product: string
  quantity: number
  unitCost: number
  discount: number
}

export type PurchaseBodyInput = {
  supplier: string
  orderDate: string
  status?: PurchaseStatus
  currency: string
  tax: number
  discount: number
  notes?: string
  rack?: string
  items: PurchaseItemInput[]
}

export type ReceiveItemInput = {
  product: string
  quantity: number
}

export type ReceiveBodyInput = {
  rack: string
  notes?: string
  items: ReceiveItemInput[]
}

function parseItem(raw: unknown, issues: ParseIssue[]): PurchaseItemInput | null {
  if (!raw || typeof raw !== 'object') {
    issues.push({ message: 'Ítem de compra inválido' })
    return null
  }
  const row = raw as Record<string, unknown>
  const product = typeof row.product === 'string' ? row.product.trim() : ''
  const quantity = Number(row.quantity)
  const unitCost = Number(row.unitCost)
  const discount = Number(row.discount ?? 0)

  if (!product) issues.push({ message: 'Producto requerido en cada línea' })
  if (!Number.isFinite(quantity) || quantity <= 0) {
    issues.push({ message: 'La cantidad debe ser mayor a cero' })
  }
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    issues.push({ message: 'El precio no puede ser negativo' })
  }
  if (!Number.isFinite(discount) || discount < 0) {
    issues.push({ message: 'El descuento no puede ser negativo' })
  }

  if (!product || !Number.isFinite(quantity) || quantity <= 0 || unitCost < 0) return null
  return { product, quantity, unitCost, discount: discount || 0 }
}

export function parsePurchaseBody(body: Record<string, unknown>): ParseResult<PurchaseBodyInput> {
  const issues: ParseIssue[] = []
  const supplier = typeof body.supplier === 'string' ? body.supplier.trim() : ''
  const orderDate = typeof body.orderDate === 'string' ? body.orderDate.trim() : ''

  if (!supplier) issues.push({ message: 'Proveedor requerido' })
  if (!orderDate) issues.push({ message: 'Fecha requerida' })

  const itemsRaw = Array.isArray(body.items) ? body.items : []
  if (!itemsRaw.length) issues.push({ message: 'Debe incluir al menos un producto' })

  const items = itemsRaw
    .map((item) => parseItem(item, issues))
    .filter((item): item is PurchaseItemInput => item !== null)

  const tax = Number(body.tax ?? 0)
  const discount = Number(body.discount ?? 0)
  if (!Number.isFinite(tax) || tax < 0) issues.push({ message: 'Impuesto inválido' })
  if (!Number.isFinite(discount) || discount < 0) issues.push({ message: 'Descuento inválido' })

  let status: PurchaseStatus | undefined
  if (body.status !== undefined) {
    const normalized = normalizePurchaseStatus(String(body.status))
    if (!PURCHASE_STATUSES.includes(normalized)) {
      issues.push({ message: 'Estado inválido' })
    } else {
      status = normalized
    }
  }

  if (issues.length) return { success: false, error: { issues } }

  return {
    success: true,
    data: {
      supplier,
      orderDate,
      status,
      currency: typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim() : 'PEN',
      tax: tax || 0,
      discount: discount || 0,
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      rack: typeof body.rack === 'string' ? body.rack.trim() : undefined,
      items,
    },
  }
}

export function parsePurchaseUpdateBody(
  body: Record<string, unknown>,
): ParseResult<Partial<PurchaseBodyInput> & { status?: PurchaseStatus | 'cancelled' }> {
  const issues: ParseIssue[] = []
  const result: Partial<PurchaseBodyInput> & { status?: PurchaseStatus | 'cancelled' } = {}

  if (body.supplier !== undefined) {
    const supplier = typeof body.supplier === 'string' ? body.supplier.trim() : ''
    if (!supplier) issues.push({ message: 'Proveedor requerido' })
    else result.supplier = supplier
  }

  if (body.orderDate !== undefined) {
    const orderDate = typeof body.orderDate === 'string' ? body.orderDate.trim() : ''
    if (!orderDate) issues.push({ message: 'Fecha requerida' })
    else result.orderDate = orderDate
  }

  if (body.items !== undefined) {
    const itemsRaw = Array.isArray(body.items) ? body.items : []
    if (!itemsRaw.length) issues.push({ message: 'Debe incluir al menos un producto' })
    result.items = itemsRaw
      .map((item) => parseItem(item, issues))
      .filter((item): item is PurchaseItemInput => item !== null)
  }

  if (body.tax !== undefined) {
    const tax = Number(body.tax)
    if (!Number.isFinite(tax) || tax < 0) issues.push({ message: 'Impuesto inválido' })
    else result.tax = tax
  }

  if (body.discount !== undefined) {
    const discount = Number(body.discount)
    if (!Number.isFinite(discount) || discount < 0) issues.push({ message: 'Descuento inválido' })
    else result.discount = discount
  }

  if (body.currency !== undefined) {
    result.currency = typeof body.currency === 'string' ? body.currency.trim() : 'PEN'
  }

  if (body.notes !== undefined) {
    result.notes = typeof body.notes === 'string' ? body.notes.trim() : undefined
  }

  if (body.rack !== undefined) {
    result.rack = typeof body.rack === 'string' ? body.rack.trim() : undefined
  }

  if (body.status !== undefined) {
    const normalized = normalizePurchaseStatus(String(body.status))
    if (normalized === 'cancelled' || PURCHASE_STATUSES.includes(normalized)) {
      result.status = normalized
    } else {
      issues.push({ message: 'Estado inválido' })
    }
  }

  if (issues.length) return { success: false, error: { issues } }
  return { success: true, data: result }
}

export function parseReceiveBody(body: Record<string, unknown>): ParseResult<ReceiveBodyInput> {
  const issues: ParseIssue[] = []
  const rack = typeof body.rack === 'string' ? body.rack.trim() : ''
  if (!rack) issues.push({ message: 'Rack requerido' })

  const itemsRaw = Array.isArray(body.items) ? body.items : []
  if (!itemsRaw.length) issues.push({ message: 'Debe indicar productos a recibir' })

  const items: ReceiveItemInput[] = []
  for (const raw of itemsRaw) {
    if (!raw || typeof raw !== 'object') {
      issues.push({ message: 'Ítem de recepción inválido' })
      continue
    }
    const row = raw as Record<string, unknown>
    const product = typeof row.product === 'string' ? row.product.trim() : ''
    const quantity = Number(row.quantity)
    if (!product) issues.push({ message: 'Producto requerido en recepción' })
    if (!Number.isFinite(quantity) || quantity <= 0) {
      issues.push({ message: 'La cantidad debe ser mayor a cero' })
    }
    if (product && quantity > 0) items.push({ product, quantity })
  }

  if (issues.length) return { success: false, error: { issues } }

  return {
    success: true,
    data: {
      rack,
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      items,
    },
  }
}

export function computeLineSubtotal(item: PurchaseItemInput): number {
  const gross = item.quantity * item.unitCost
  return Math.max(0, gross - (item.discount ?? 0))
}

export function computePurchaseTotals(items: PurchaseItemInput[], orderDiscount = 0, tax = 0) {
  const subtotal = items.reduce((sum, item) => sum + computeLineSubtotal(item), 0)
  const net = Math.max(0, subtotal - orderDiscount)
  const total = net + tax
  return { subtotal, total }
}

export function normalizePurchaseStatus(status: string | undefined): PurchaseStatus {
  if (status === 'sent') return 'pending'
  if (status === 'invoiced') return 'received'
  if (PURCHASE_STATUSES.includes(status as PurchaseStatus)) return status as PurchaseStatus
  return 'draft'
}

export function isEditableStatus(status: string): boolean {
  const normalized = normalizePurchaseStatus(status)
  return normalized === 'draft' || normalized === 'pending'
}

export function canReceiveStatus(status: string): boolean {
  const normalized = normalizePurchaseStatus(status)
  return normalized === 'pending' || normalized === 'partial'
}
