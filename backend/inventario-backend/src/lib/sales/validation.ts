export const SALE_STATUSES = [
  'draft',
  'pending',
  'confirmed',
  'delivered',
  'cancelled',
  'returned',
] as const

export type SaleStatus = (typeof SALE_STATUSES)[number]

type ParseIssue = { message: string }
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: ParseIssue[] } }

export type SaleItemInput = {
  product: string
  quantity: number
  unitPrice: number
  discount: number
}

export type SaleBodyInput = {
  customer: string
  saleDate: string
  status?: SaleStatus
  tax: number
  discountAmount: number
  notes?: string
  rack?: string
  items: SaleItemInput[]
}

export type ConfirmBodyInput = {
  rack?: string
  notes?: string
}

export type DeliverBodyInput = {
  rack?: string
  notes?: string
}

function parseItem(raw: unknown, issues: ParseIssue[]): SaleItemInput | null {
  if (!raw || typeof raw !== 'object') {
    issues.push({ message: 'Ítem de venta inválido' })
    return null
  }
  const row = raw as Record<string, unknown>
  const product = typeof row.product === 'string' ? row.product.trim() : ''
  const quantity = Number(row.quantity)
  const unitPrice = Number(row.unitPrice)
  const discount = Number(row.discount ?? 0)

  if (!product) issues.push({ message: 'Producto requerido en cada línea' })
  if (!Number.isFinite(quantity) || quantity <= 0) {
    issues.push({ message: 'La cantidad debe ser mayor a cero' })
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    issues.push({ message: 'El precio no puede ser negativo' })
  }
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    issues.push({ message: 'El descuento debe estar entre 0 y 100' })
  }

  if (!product || !Number.isFinite(quantity) || quantity <= 0 || unitPrice < 0) return null
  return { product, quantity, unitPrice, discount: discount || 0 }
}

export function parseSaleBody(body: Record<string, unknown>): ParseResult<SaleBodyInput> {
  const issues: ParseIssue[] = []
  const customer = typeof body.customer === 'string' ? body.customer.trim() : ''
  const saleDate = typeof body.saleDate === 'string' ? body.saleDate.trim() : ''

  if (!customer) issues.push({ message: 'Cliente requerido' })
  if (!saleDate) issues.push({ message: 'Fecha requerida' })

  const itemsRaw = Array.isArray(body.items) ? body.items : []
  if (!itemsRaw.length) issues.push({ message: 'Debe incluir al menos un producto' })

  const items = itemsRaw
    .map((item) => parseItem(item, issues))
    .filter((item): item is SaleItemInput => item !== null)

  const tax = Number(body.tax ?? 0)
  const discountAmount = Number(body.discountAmount ?? 0)
  if (!Number.isFinite(tax) || tax < 0) issues.push({ message: 'Impuesto inválido' })
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    issues.push({ message: 'Descuento inválido' })
  }

  let status: SaleStatus | undefined
  if (body.status !== undefined) {
    const normalized = normalizeSaleStatus(String(body.status))
    if (!SALE_STATUSES.includes(normalized)) {
      issues.push({ message: 'Estado inválido' })
    } else {
      status = normalized
    }
  }

  if (issues.length) return { success: false, error: { issues } }

  return {
    success: true,
    data: {
      customer,
      saleDate,
      status,
      tax: tax || 0,
      discountAmount: discountAmount || 0,
      notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
      rack: typeof body.rack === 'string' ? body.rack.trim() : undefined,
      items,
    },
  }
}

export function parseSaleUpdateBody(
  body: Record<string, unknown>,
): ParseResult<Partial<SaleBodyInput> & { status?: SaleStatus }> {
  const issues: ParseIssue[] = []
  const result: Partial<SaleBodyInput> & { status?: SaleStatus } = {}

  if (body.customer !== undefined) {
    const customer = typeof body.customer === 'string' ? body.customer.trim() : ''
    if (!customer) issues.push({ message: 'Cliente requerido' })
    else result.customer = customer
  }

  if (body.saleDate !== undefined) {
    const saleDate = typeof body.saleDate === 'string' ? body.saleDate.trim() : ''
    if (!saleDate) issues.push({ message: 'Fecha requerida' })
    else result.saleDate = saleDate
  }

  if (body.items !== undefined) {
    const itemsRaw = Array.isArray(body.items) ? body.items : []
    if (!itemsRaw.length) issues.push({ message: 'Debe incluir al menos un producto' })
    result.items = itemsRaw
      .map((item) => parseItem(item, issues))
      .filter((item): item is SaleItemInput => item !== null)
  }

  if (body.tax !== undefined) {
    const tax = Number(body.tax)
    if (!Number.isFinite(tax) || tax < 0) issues.push({ message: 'Impuesto inválido' })
    else result.tax = tax
  }

  if (body.discountAmount !== undefined) {
    const discountAmount = Number(body.discountAmount)
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      issues.push({ message: 'Descuento inválido' })
    } else result.discountAmount = discountAmount
  }

  if (body.notes !== undefined) {
    result.notes = typeof body.notes === 'string' ? body.notes.trim() : undefined
  }

  if (body.rack !== undefined) {
    result.rack = typeof body.rack === 'string' ? body.rack.trim() : undefined
  }

  if (body.status !== undefined) {
    const normalized = normalizeSaleStatus(String(body.status))
    if (!SALE_STATUSES.includes(normalized)) {
      issues.push({ message: 'Estado inválido' })
    } else {
      result.status = normalized
    }
  }

  if (issues.length) return { success: false, error: { issues } }
  return { success: true, data: result }
}

export function parseConfirmBody(body: Record<string, unknown>): ParseResult<ConfirmBodyInput> {
  const issues: ParseIssue[] = []
  const rack = typeof body.rack === 'string' ? body.rack.trim() : undefined
  const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined

  if (issues.length) return { success: false, error: { issues } }
  return { success: true, data: { rack, notes } }
}

export function parseDeliverBody(body: Record<string, unknown>): ParseResult<DeliverBodyInput> {
  const issues: ParseIssue[] = []
  const rack = typeof body.rack === 'string' ? body.rack.trim() : undefined
  const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined

  if (issues.length) return { success: false, error: { issues } }
  return { success: true, data: { rack, notes } }
}

export function computeLineTotal(item: SaleItemInput): number {
  const gross = item.quantity * item.unitPrice
  const discount = gross * ((item.discount ?? 0) / 100)
  return Math.max(0, gross - discount)
}

export function computeSaleTotals(items: SaleItemInput[], discountAmount = 0, tax = 0) {
  const subtotal = items.reduce((sum, item) => sum + computeLineTotal(item), 0)
  const net = Math.max(0, subtotal - discountAmount)
  const total = net + tax
  return { subtotal, total }
}

export function normalizeSaleStatus(status: string | undefined): SaleStatus {
  if (SALE_STATUSES.includes(status as SaleStatus)) return status as SaleStatus
  return 'draft'
}

export function isEditableSaleStatus(status: string): boolean {
  const normalized = normalizeSaleStatus(status)
  return normalized === 'draft' || normalized === 'pending'
}

export function canConfirmSaleStatus(status: string): boolean {
  const normalized = normalizeSaleStatus(status)
  return normalized === 'draft' || normalized === 'pending'
}

export function canCancelSaleStatus(status: string): boolean {
  const normalized = normalizeSaleStatus(status)
  return normalized === 'draft' || normalized === 'pending' || normalized === 'confirmed'
}

export function isFinalSaleStatus(status: string): boolean {
  const normalized = normalizeSaleStatus(status)
  return normalized === 'delivered' || normalized === 'returned' || normalized === 'cancelled'
}

export function canTransitionToDelivered(status: string): boolean {
  return normalizeSaleStatus(status) === 'confirmed'
}

export function canTransitionToReturned(status: string): boolean {
  return normalizeSaleStatus(status) === 'delivered'
}
