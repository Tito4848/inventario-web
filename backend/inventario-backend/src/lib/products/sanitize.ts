import type { Payload } from 'payload'

type Rel = string | { id: string; name?: string; code?: string } | null | undefined

function relLabel(rel: Rel, fallback = '-'): string {
  if (!rel) return fallback
  if (typeof rel === 'object') return rel.name || rel.code || String(rel.id)
  return String(rel)
}

function relId(rel: Rel): string | null {
  if (!rel) return null
  if (typeof rel === 'object') return String(rel.id)
  return String(rel)
}

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

export function sanitizeProductForList(
  doc: Record<string, unknown>,
  stockByProduct: Record<string, number> = {},
): ManagedProduct {
  const id = String(doc.id)
  const imagesRaw = doc.images as Array<Record<string, unknown>> | undefined
  const imageSingle = doc.image as Record<string, unknown> | undefined

  const images: ManagedProduct['images'] = []
  if (Array.isArray(imagesRaw)) {
    for (const img of imagesRaw) {
      if (img && typeof img === 'object' && img.id) {
        images.push({
          id: String(img.id),
          url: typeof img.url === 'string' ? img.url : null,
          alt: typeof img.alt === 'string' ? img.alt : null,
        })
      }
    }
  } else if (imageSingle?.id) {
    images.push({
      id: String(imageSingle.id),
      url: typeof imageSingle.url === 'string' ? imageSingle.url : null,
      alt: typeof imageSingle.alt === 'string' ? imageSingle.alt : null,
    })
  }

  return {
    id,
    code: String(doc.code ?? ''),
    name: String(doc.name ?? ''),
    description: (doc.description as string) ?? null,
    barcode: (doc.barcode as string) ?? null,
    category: relId(doc.category as Rel),
    categoryName: relLabel(doc.category as Rel),
    subcategory: relId(doc.subcategory as Rel),
    subcategoryName: relLabel(doc.subcategory as Rel),
    brand: relId(doc.brand as Rel),
    brandName: relLabel(doc.brand as Rel, ''),
    supplier: relId(doc.supplier as Rel),
    supplierName: relLabel(doc.supplier as Rel, ''),
    baseUnit: relId(doc.baseUnit as Rel),
    baseUnitName: relLabel(doc.baseUnit as Rel),
    purchasePrice: doc.purchasePrice != null ? Number(doc.purchasePrice) : null,
    salePrice: doc.salePrice != null ? Number(doc.salePrice) : null,
    minStockBase: doc.minStockBase != null ? Number(doc.minStockBase) : null,
    weight: doc.weight != null ? Number(doc.weight) : null,
    stock: stockByProduct[id] ?? 0,
    status: (doc.status as string) ?? 'active',
    active: doc.active !== false,
    images,
    taxRate: doc.taxRate != null ? Number(doc.taxRate) : null,
    createdAt: doc.createdAt as string | undefined,
    updatedAt: doc.updatedAt as string | undefined,
  }
}

export async function aggregateStockByProduct(
  payload: Payload,
  productIds: string[],
): Promise<Record<string, number>> {
  if (!productIds.length) return {}

  const levels = await payload.find({
    collection: 'stock-levels',
    where: { product: { in: productIds } },
    limit: 10000,
    depth: 0,
  })

  const stock: Record<string, number> = {}
  for (const level of levels.docs) {
    const levelDoc = level as unknown as Record<string, unknown>
    const product = levelDoc.product
    const productId = typeof product === 'object' && product ? String((product as { id: string }).id) : String(product)
    stock[productId] = (stock[productId] ?? 0) + (Number(levelDoc.quantityBase) || 0)
  }

  return stock
}
