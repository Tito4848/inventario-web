import { apiFetch, type PaginatedResponse } from './api'

export type StockStatus = 'out' | 'low' | 'ok' | 'over_max'

export type StockRow = {
  id: string
  product: unknown
  rack?: unknown
  quantityBase: number
  availableQtyBase: number
  reservedQtyBase: number
  value: number
  minStockBase: number
  maxStockBase: number | null
  stockStatus: StockStatus
  isBelowMin: boolean
  isOutOfStock: boolean
}

export type MovementRow = {
  id: string
  date: string
  movementType: string
  movementTypeLabel: string
  label: string
  notes: string
  document: string
  productName: string
  productCode: string
  rackName: string
  quantity: number
  quantityBase: number
  totalValue: number
  createdByName: string
}

export type KardexRow = {
  id: string
  date: string
  movementType: string
  movementTypeLabel: string
  label: string
  document: string
  notes: string
  quantityBase: number
  totalValue: number
  inQty: number
  outQty: number
  previousQty: number
  balanceQty: number
  newQty: number
  inValue: number
  outValue: number
  balanceValue: number
  createdByName: string
  rack?: unknown
}

export type StockListParams = {
  product?: string
  rack?: string
  category?: string
  belowMin?: boolean
  outOfStock?: boolean
  aggregate?: boolean
  status?: StockStatus
}

export type MovementListParams = {
  product?: string
  rack?: string
  category?: string
  movementType?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type KardexListParams = {
  product?: string
  category?: string
  rack?: string
  movementType?: string
  from?: string
  to?: string
}

export type LookupOption = { id: string; label: string; code?: string }

function toParams(params: Record<string, string | number | boolean | undefined>) {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    if (typeof value === 'boolean') out[key] = value ? 'true' : 'false'
    else out[key] = String(value)
  }
  return out
}

export async function fetchStock(params: StockListParams = {}) {
  return apiFetch<PaginatedResponse<StockRow>>('/api/inventory/stock', {
    params: toParams({
      aggregate: params.aggregate ?? true,
      ...params,
    }),
  })
}

export async function fetchMovements(params: MovementListParams = {}) {
  return apiFetch<PaginatedResponse<MovementRow>>('/api/inventory/movements', {
    params: toParams({ limit: 50, page: 1, ...params }),
  })
}

export async function fetchKardex(params: KardexListParams) {
  return apiFetch<PaginatedResponse<KardexRow>>('/api/inventory/kardex', {
    params: toParams(params),
  })
}

export async function fetchInventoryLookups() {
  const [products, racks, categories, units] = await Promise.all([
    apiFetch<PaginatedResponse<{ id: string; name: string; code?: string }>>('/api/products', {
      params: { limit: 200, depth: 0 },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; code?: string }>>('/api/racks', {
      params: { limit: 200, depth: 0 },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/api/categories', {
      params: { limit: 200, depth: 0 },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; abbreviation: string }>>('/api/units', {
      params: { limit: 200, depth: 0 },
    }),
  ])

  return {
    products: products.docs.map((p) => ({ id: p.id, label: p.name, code: p.code })),
    racks: racks.docs.map((r) => ({ id: r.id, label: r.name, code: r.code })),
    categories: categories.docs.map((c) => ({ id: c.id, label: c.name })),
    units: units.docs,
  }
}

export async function createMovement(data: Record<string, unknown>) {
  return apiFetch('/api/stock-movements', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  out: 'Agotado',
  low: 'Stock bajo',
  ok: 'OK',
  over_max: 'Sobre máximo',
}

export const MOVEMENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Salida' },
  { value: 'adjust_in', label: 'Ajuste (+)' },
  { value: 'adjust_out', label: 'Ajuste (-)' },
]
