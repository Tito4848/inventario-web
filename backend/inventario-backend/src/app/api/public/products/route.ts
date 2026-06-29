import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'

import { aggregateStockByProduct } from '@/lib/products/sanitize'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim()
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)))
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))

  const payload = await getPayload({ config })

  const where: Where = search
    ? {
        and: [
          { active: { equals: true } },
          {
            or: [
              { name: { contains: search } },
              { code: { contains: search } },
              { barcode: { contains: search } },
              { description: { contains: search } },
            ],
          },
        ],
      }
    : { active: { equals: true } }

  const products = await payload.find({
    collection: 'products',
    where,
    page,
    limit,
    sort: 'name',
    depth: 2,
    select: {
      id: true,
      name: true,
      code: true,
      barcode: true,
      description: true,
      salePrice: true,
      purchasePrice: true,
      active: true,
      status: true,
      brand: true,
      category: true,
      subcategory: true,
      images: true,
      image: true,
      baseUnit: true,
      weight: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const productIds = products.docs.map((d) => String(d.id))
  const stockByProduct = await aggregateStockByProduct(payload, productIds)

  const docs = products.docs.map((doc) => {
    const d = doc as unknown as Record<string, unknown>
    const brand = d.brand as { name?: string } | string | null
    const category = d.category as { name?: string } | string | null
    const imagesRaw = d.images as Array<{ url?: string }> | undefined
    const imageSingle = d.image as { url?: string } | undefined
    const imageUrl =
      imagesRaw?.[0]?.url ?? imageSingle?.url ?? null

    return {
      id: d.id,
      name: d.name,
      code: d.code,
      barcode: d.barcode,
      description: d.description,
      salePrice: d.salePrice,
      active: d.active,
      brandName: typeof brand === 'object' && brand ? brand.name : null,
      categoryName: typeof category === 'object' && category ? category.name : null,
      stock: stockByProduct[String(d.id)] ?? 0,
      imageUrl,
      weight: d.weight,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }
  })

  return Response.json({
    docs,
    totalDocs: products.totalDocs,
    limit: products.limit,
    page: products.page,
    totalPages: products.totalPages,
  })
}
