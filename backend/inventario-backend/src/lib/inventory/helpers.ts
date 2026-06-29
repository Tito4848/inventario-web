export type StockStatus = 'out' | 'low' | 'ok' | 'over_max'

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function computeStockStatus(qty: number, min: number, max?: number | null): StockStatus {
  if (qty <= 0) return 'out'
  if (qty <= min) return 'low'
  if (max != null && max > 0 && qty > max) return 'over_max'
  return 'ok'
}

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjust_in: 'Ajuste (+)',
  adjust_out: 'Ajuste (-)',
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  out: 'Agotado',
  low: 'Stock bajo',
  ok: 'OK',
  over_max: 'Sobre máximo',
}

export function isInboundMovement(type: string): boolean {
  return type === 'in' || type === 'adjust_in'
}

export function isOutboundMovement(type: string): boolean {
  return type === 'out' || type === 'adjust_out'
}

export function getProductId(product: unknown): string | null {
  if (!product) return null
  if (typeof product === 'string') return product
  const rec = asRecord(product)
  return rec?.id ? String(rec.id) : null
}
