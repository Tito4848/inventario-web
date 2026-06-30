import { apiFetch, type PaginatedResponse } from './api'
import { getAuthHeaders } from './auth'

export type SaleItem = {
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

export type SaleOrder = {
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
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export type SaleListParams = {
  page?: number
  limit?: number
  sort?: string
  search?: string
  status?: string
  customer?: string
  createdBy?: string
  from?: string
  to?: string
  product?: string
  category?: string
  pending?: boolean
}

export type SaleFormData = {
  customer: string
  saleDate: string
  status?: string
  tax?: number
  discountAmount?: number
  notes?: string
  rack?: string
  items: Array<{
    product: string
    quantity: number
    unitPrice: number
    discount?: number
  }>
}

export type SaleActionData = {
  rack?: string
  notes?: string
}

export type SaleStats = {
  dailyCount: number
  monthlyCount: number
  monthlyRevenue: number
  dailyRevenue: number
  pendingOrders: number
  confirmedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  topCustomer?: { id: string; name: string; count: number; amount: number } | null
  topProducts: Array<{ id: string; name: string; quantity: number; amount: number }>
}

export const SALE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'returned', label: 'Devuelta' },
] as const

export const SALE_SORT_OPTIONS = [
  { value: '-saleDate', label: 'Fecha ↓' },
  { value: 'saleDate', label: 'Fecha ↑' },
  { value: '-total', label: 'Total ↓' },
  { value: 'total', label: 'Total ↑' },
  { value: 'orderNumber', label: 'N° orden ↑' },
  { value: '-orderNumber', label: 'N° orden ↓' },
]

export const SALE_REPORT_TYPES = [
  { id: 'summary', name: 'Resumen de ventas' },
  { id: 'by-date', name: 'Ventas por fecha' },
  { id: 'by-customer', name: 'Ventas por cliente' },
  { id: 'by-product', name: 'Ventas por producto' },
  { id: 'by-category', name: 'Ventas por categoría' },
  { id: 'by-user', name: 'Ventas por usuario' },
  { id: 'top-products', name: 'Productos más vendidos' },
  { id: 'top-customers', name: 'Clientes frecuentes' },
  { id: 'daily-revenue', name: 'Ingresos diarios' },
  { id: 'monthly-revenue', name: 'Ingresos mensuales' },
  { id: 'csv', name: 'Exportación completa (CSV)' },
]

const API_URL = import.meta.env.VITE_API_URL || ''

export function saleStatusClass(status: string): string {
  switch (status) {
    case 'delivered':
      return 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'confirmed':
      return 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'cancelled':
      return 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'returned':
      return 'rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'pending':
      return 'rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'draft':
      return 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300'
    default:
      return 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
  }
}

export function formatSaleDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-PE')
}

export function formatSaleMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)
}

/** Cálculo de totales solo para vista previa del formulario */
export function previewLineTotal(quantity: number, unitPrice: number, discountPercent: number) {
  const gross = quantity * unitPrice
  const discount = gross * (discountPercent / 100)
  return Math.max(0, gross - discount)
}

export function previewSaleTotals(
  items: Array<{ quantity: number; unitPrice: number; discount: number }>,
  discountAmount = 0,
  tax = 0,
) {
  const subtotal = items.reduce(
    (sum, item) => sum + previewLineTotal(item.quantity, item.unitPrice, item.discount),
    0,
  )
  const net = Math.max(0, subtotal - discountAmount)
  return { subtotal, total: net + tax }
}

export async function fetchSales(params: SaleListParams = {}) {
  return apiFetch<PaginatedResponse<SaleOrder>>('/api/sales', { params })
}

export async function fetchSale(id: string) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}`)
}

export async function createSale(data: SaleFormData) {
  return apiFetch<{ doc: SaleOrder }>('/api/sales', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSale(id: string, data: Partial<SaleFormData> & { status?: string }) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSale(id: string) {
  return apiFetch<{ message: string }>(`/api/sales/${id}`, { method: 'DELETE' })
}

export async function confirmSale(id: string, data: SaleActionData = {}) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deliverSale(id: string, data: SaleActionData = {}) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}/deliver`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function cancelSale(id: string) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function returnSale(id: string) {
  return apiFetch<{ doc: SaleOrder }>(`/api/sales/${id}/return`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function fetchSaleStats() {
  return apiFetch<SaleStats>('/api/sales/stats')
}

export async function fetchSaleReports(params: Record<string, string | undefined>) {
  return apiFetch<{ type: string; docs: unknown[]; total?: number; totalDocs?: number; totalAmount?: number }>(
    '/api/sales/reports',
    { params },
  )
}

export async function downloadSaleReportCsv(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries({ format: 'csv', ...params })) {
    if (value !== undefined && value !== '') search.set(key, value)
  }
  const url = `${API_URL}/api/sales/reports?${search}`
  const res = await fetch(url, { credentials: 'include', headers: getAuthHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.text()
}

export async function fetchSaleLookups() {
  const [customers, products, racks, categories, users] = await Promise.all([
    apiFetch<PaginatedResponse<{ id: string; businessName?: string; name?: string }>>('/api/customers', {
      params: { limit: 200, depth: 0, sort: 'businessName' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; code?: string; salePrice?: number }>>(
      '/api/products',
      { params: { limit: 500, depth: 0, sort: 'name' } },
    ),
    apiFetch<PaginatedResponse<{ id: string; name?: string; code?: string }>>('/api/racks', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/api/categories', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; email?: string; fullName?: string }>>('/api/users/manage', {
      params: { limit: 200, depth: 0 },
    }).catch(() => ({ docs: [] as Array<{ id: string; email?: string; fullName?: string }> })),
  ])

  return {
    customers: customers.docs.map((c) => ({
      id: String(c.id),
      label: c.businessName || c.name || String(c.id),
    })),
    products: products.docs.map((p) => ({
      id: String(p.id),
      label: p.code ? `${p.code} — ${p.name}` : p.name,
      salePrice: p.salePrice ?? 0,
    })),
    racks: racks.docs.map((r) => ({
      id: String(r.id),
      label: r.name || r.code || String(r.id),
    })),
    categories: categories.docs.map((c) => ({
      id: String(c.id),
      label: c.name,
    })),
    users: users.docs.map((u) => ({
      id: String(u.id),
      label: u.fullName || u.email || String(u.id),
    })),
  }
}
