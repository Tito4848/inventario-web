import { getAuthHeaders } from './auth'

const API_URL = import.meta.env.VITE_API_URL || ''

type FetchOptions = RequestInit & { params?: Record<string, string | number | boolean | undefined> }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options
  let url = `${API_URL}${path}`

  if (params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') search.set(key, String(value))
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders(
      init.body ? { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) } : (init.headers as Record<string, string>),
    ),
    ...init,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type PaginatedResponse<T> = {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
}

export async function fetchCollection<T>(
  slug: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<PaginatedResponse<T>> {
  return apiFetch(`/api/${slug}`, { params: { limit: 100, depth: 1, ...params } })
}

export async function createDocument<T>(slug: string, data: Record<string, unknown>): Promise<T> {
  return apiFetch(`/api/${slug}`, { method: 'POST', body: JSON.stringify(data) })
}

export async function updateDocument<T>(slug: string, id: string, data: Record<string, unknown>): Promise<T> {
  return apiFetch(`/api/${slug}/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteDocument(slug: string, id: string): Promise<void> {
  await apiFetch(`/api/${slug}/${id}`, { method: 'DELETE' })
}

export type DashboardStats = {
  totalProducts: number
  totalCategories: number
  totalSuppliers: number
  totalUsers: number
  totalMovements: number
  lowStock: number
  outOfStock: number
  monthlySales: number
  monthlyPurchases: number
  inventoryValue: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    return await apiFetch('/api/dashboard/stats')
  } catch {
    return {
      totalProducts: 0,
      totalCategories: 0,
      totalSuppliers: 0,
      totalUsers: 0,
      totalMovements: 0,
      lowStock: 0,
      outOfStock: 0,
      monthlySales: 0,
      monthlyPurchases: 0,
      inventoryValue: 0,
    }
  }
}

export async function createProduct(data: Record<string, unknown>) {
  return apiFetch('/api/products/manage', { method: 'POST', body: JSON.stringify(data) })
}

export async function fetchAnalytics(): Promise<Record<string, unknown>> {
  try {
    return await apiFetch('/api/dashboard/analytics')
  } catch {
    return {}
  }
}
