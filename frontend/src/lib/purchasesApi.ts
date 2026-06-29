import { apiFetch, type PaginatedResponse } from './api'

export type PurchaseItem = {
  id?: string | null
  product: string
  productName?: string
  productCode?: string
  quantity: number
  quantityReceived: number
  pendingQuantity: number
  unitCost: number
  discount: number
  total: number
}

export type PurchaseReception = {
  id?: string | null
  date: string
  receivedBy?: string | null
  receivedByName?: string
  notes?: string | null
  items?: Array<{ product: string; productName?: string; quantity: number }>
}

export type PurchaseOrder = {
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
  items: PurchaseItem[]
  receptions: PurchaseReception[]
  createdAt: string
  updatedAt: string
}

export type PurchaseListParams = {
  page?: number
  limit?: number
  sort?: string
  search?: string
  status?: string
  supplier?: string
  createdBy?: string
  from?: string
  to?: string
  product?: string
  pending?: boolean
}

export type PurchaseFormData = {
  supplier: string
  orderDate: string
  status?: string
  currency?: string
  tax?: number
  discount?: number
  notes?: string
  rack?: string
  items: Array<{
    product: string
    quantity: number
    unitCost: number
    discount?: number
  }>
}

export type ReceiveFormData = {
  rack: string
  notes?: string
  items: Array<{ product: string; quantity: number }>
}

export type PurchaseStats = {
  dailyCount: number
  monthlyCount: number
  monthlyAmount: number
  pendingOrders: number
  receivedOrders: number
  partialOrders: number
  topSupplier?: { id: string; name: string; count: number; amount: number } | null
  topProducts: Array<{ id: string; name: string; quantity: number }>
}

export const PURCHASE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'received', label: 'Recibida' },
  { value: 'cancelled', label: 'Cancelada' },
]

export async function fetchPurchases(params: PurchaseListParams = {}) {
  return apiFetch<PaginatedResponse<PurchaseOrder>>('/api/purchases', { params })
}

export async function fetchPurchase(id: string) {
  return apiFetch<{ doc: PurchaseOrder }>(`/api/purchases/${id}`)
}

export async function createPurchase(data: PurchaseFormData) {
  return apiFetch<{ doc: PurchaseOrder }>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePurchase(id: string, data: Partial<PurchaseFormData> & { status?: string }) {
  return apiFetch<{ doc: PurchaseOrder }>(`/api/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePurchase(id: string) {
  return apiFetch<{ message: string }>(`/api/purchases/${id}`, { method: 'DELETE' })
}

export async function receivePurchase(id: string, data: ReceiveFormData) {
  return apiFetch<{ doc: PurchaseOrder }>(`/api/purchases/${id}/receive`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchPurchaseStats() {
  return apiFetch<PurchaseStats>('/api/purchases/stats')
}

export async function fetchPurchaseReports(params: Record<string, string | undefined>) {
  return apiFetch<{ type: string; docs: unknown[]; total?: number; totalDocs?: number; totalAmount?: number }>(
    '/api/purchases/reports',
    { params },
  )
}

export async function fetchPurchaseLookups() {
  const [suppliers, products, racks] = await Promise.all([
    apiFetch<PaginatedResponse<{ id: string; businessName?: string; name?: string }>>('/api/suppliers', {
      params: { limit: 200, depth: 0, sort: 'businessName' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; code?: string; purchasePrice?: number }>>(
      '/api/products',
      { params: { limit: 500, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name?: string; code?: string }>>('/api/racks', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
  ])

  return {
    suppliers: suppliers.docs.map((s) => ({
      id: String(s.id),
      label: s.businessName || s.name || String(s.id),
    })),
    products: products.docs.map((p) => ({
      id: String(p.id),
      label: p.code ? `${p.code} — ${p.name}` : p.name,
      purchasePrice: p.purchasePrice ?? 0,
    })),
    racks: racks.docs.map((r) => ({
      id: String(r.id),
      label: r.name || r.code || String(r.id),
    })),
  }
}
