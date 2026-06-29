export type ProductInput = {
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
  status?: 'active' | 'inactive' | 'discontinued'
  active?: boolean
  images?: string[]
  taxRate?: number
}

type ParseResult =
  | { success: true; data: ProductInput }
  | { success: false; error: { issues: Array<{ message: string }> } }

export function parseProductBody(body: Record<string, unknown>): ParseResult {
  const issues: Array<{ message: string }> = []

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const baseUnit = typeof body.baseUnit === 'string' ? body.baseUnit.trim() : ''

  if (!code) issues.push({ message: 'El SKU es obligatorio' })
  if (!name) issues.push({ message: 'El nombre es obligatorio' })
  if (!category) issues.push({ message: 'La categoría es obligatoria' })
  if (!baseUnit) issues.push({ message: 'La unidad de medida es obligatoria' })

  const purchasePrice = Number(body.purchasePrice ?? 0)
  const salePrice = Number(body.salePrice ?? 0)
  const minStockBase = Number(body.minStockBase ?? 0)

  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    issues.push({ message: 'El precio de compra debe ser mayor o igual a cero' })
  }
  if (!Number.isFinite(salePrice) || salePrice < 0) {
    issues.push({ message: 'El precio de venta debe ser mayor o igual a cero' })
  }
  if (!Number.isFinite(minStockBase) || minStockBase < 0) {
    issues.push({ message: 'El stock mínimo debe ser mayor o igual a cero' })
  }

  let weight: number | undefined
  if (body.weight !== undefined && body.weight !== '') {
    weight = Number(body.weight)
    if (!Number.isFinite(weight) || weight < 0) {
      issues.push({ message: 'El peso debe ser mayor o igual a cero' })
    }
  }

  const status =
    body.status === 'inactive' || body.status === 'discontinued' || body.status === 'active'
      ? body.status
      : undefined

  if (issues.length) return { success: false, error: { issues } }

  return {
    success: true,
    data: {
      code,
      name,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
      barcode: typeof body.barcode === 'string' ? body.barcode.trim() : undefined,
      category,
      subcategory: typeof body.subcategory === 'string' ? body.subcategory.trim() : undefined,
      brand: typeof body.brand === 'string' ? body.brand.trim() : undefined,
      supplier: typeof body.supplier === 'string' ? body.supplier.trim() : undefined,
      baseUnit,
      purchasePrice,
      salePrice,
      minStockBase,
      weight,
      status,
      active: typeof body.active === 'boolean' ? body.active : undefined,
      images: Array.isArray(body.images)
        ? body.images.filter((id): id is string => typeof id === 'string')
        : undefined,
      taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
    },
  }
}
