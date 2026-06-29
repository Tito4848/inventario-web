import { apiFetch, type PaginatedResponse } from './api'

export type ManagedProduct = {
  id: string
  code: string
  name: string
  description?: string | null
  barcode?: string | null
  category?: string | null
  categoryName?: string
  subcategory?: string | null
  subcategoryName?: string
  brand?: string | null
  brandName?: string
  supplier?: string | null
  supplierName?: string
  baseUnit?: string | null
  baseUnitName?: string
  purchasePrice?: number | null
  salePrice?: number | null
  minStockBase?: number | null
  weight?: number | null
  stock?: number
  status?: string
  active?: boolean
  images?: Array<{ id: string; url?: string | null; alt?: string | null }>
  taxRate?: number | null
  createdAt?: string
  updatedAt?: string
}

export type ProductListParams = {
  page?: number
  limit?: number
  sort?: string
  search?: string
  status?: string
  category?: string
  subcategory?: string
  brand?: string
  supplier?: string
  active?: string
}

export type ProductFormData = {
  code: string
  name: string
  description?: string
  barcode?: string
  category: string
  subcategory?: string
  brand?: string
  supplier?: string
  baseUnit: string
  purchasePrice: number
  salePrice: number
  minStockBase: number
  weight?: number
  status?: string
  active?: boolean
  images?: string[]
  taxRate?: number
}

export type LookupOption = { id: string; label: string }

export async function fetchProducts(params: ProductListParams = {}) {
  return apiFetch<PaginatedResponse<ManagedProduct>>('/api/products/manage', { params })
}

export async function fetchProduct(id: string) {
  return apiFetch<{ doc: ManagedProduct }>(`/api/products/manage/${id}`)
}

export async function createProduct(data: ProductFormData) {
  return apiFetch<{ doc: ManagedProduct }>('/api/products/manage', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  return apiFetch<{ doc: ManagedProduct }>(`/api/products/manage/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProduct(id: string) {
  return apiFetch<{ message: string }>(`/api/products/manage/${id}`, { method: 'DELETE' })
}

export async function activateProduct(id: string) {
  return apiFetch<{ doc: ManagedProduct }>(`/api/products/manage/${id}/activate`, {
    method: 'POST',
  })
}

export async function deactivateProduct(id: string) {
  return apiFetch<{ doc: ManagedProduct }>(`/api/products/manage/${id}/deactivate`, {
    method: 'POST',
  })
}

export async function fetchProductLookups() {
  const [categories, subcategories, brands, suppliers, units] = await Promise.all([
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/api/categories', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; category: string | { id: string } }>>(
      '/api/subcategories',
      { params: { limit: 200, depth: 0, sort: 'name' } },
    ),
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/api/brands', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string }>>('/api/suppliers', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
    apiFetch<PaginatedResponse<{ id: string; name: string; abbreviation?: string }>>('/api/units', {
      params: { limit: 200, depth: 0, sort: 'name' },
    }),
  ])

  return {
    categories: categories.docs.map((c) => ({ id: String(c.id), label: c.name })),
    subcategories: subcategories.docs.map((s) => ({
      id: String(s.id),
      label: s.name,
      categoryId:
        typeof s.category === 'object' ? String(s.category.id) : String(s.category),
    })),
    brands: brands.docs.map((b) => ({ id: String(b.id), label: b.name })),
    suppliers: suppliers.docs.map((s) => ({ id: String(s.id), label: s.name })),
    units: units.docs.map((u) => ({
      id: String(u.id),
      label: u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name,
    })),
  }
}

const API_URL = import.meta.env.VITE_API_URL || ''

export async function uploadProductImage(file: File, alt: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('_payload', JSON.stringify({ alt }))

  const res = await fetch(`${API_URL}/api/media`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'No se pudo subir la imagen')
  }

  const json = (await res.json()) as { doc?: { id: string } }
  if (!json.doc?.id) throw new Error('Respuesta inválida al subir imagen')
  return json.doc.id
}
