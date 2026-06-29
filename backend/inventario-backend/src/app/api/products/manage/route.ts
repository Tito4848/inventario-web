import { getPayload } from 'payload'
import config from '@payload-config'

import { canCreateProducts, canViewProductsModule } from '@/access/productsAccess'
import { buildProductListWhere, parseProductListQuery } from '@/lib/products/listQuery'
import {
  aggregateStockByProduct,
  sanitizeProductForList,
} from '@/lib/products/sanitize'
import { parseProductBody } from '@/lib/products/validation'
import { requireAuth } from '@/lib/auth/requireAuth'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

async function validateSubcategory(
  payload: Awaited<ReturnType<typeof getPayload>>,
  subcategoryId: string,
  categoryId: string,
): Promise<string | null> {
  try {
    const sub = await payload.findByID({
      collection: 'subcategories',
      id: subcategoryId,
      depth: 0,
      overrideAccess: true,
    })
    const subCatId =
      typeof sub.category === 'object' ? sub.category?.id : sub.category
    if (String(subCatId) !== String(categoryId)) {
      return 'La subcategoría no pertenece a la categoría seleccionada'
    }
    return null
  } catch {
    return 'Subcategoría no encontrada'
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canViewProductsModule(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parseProductListQuery(url)
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'products',
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    where: buildProductListWhere(query),
    depth: 2,
    overrideAccess: false,
    user: auth.user,
  })

  const productIds = result.docs.map((d) => String(d.id))
  const stockByProduct = await aggregateStockByProduct(payload, productIds)

  return Response.json({
    docs: result.docs.map((doc) =>
      sanitizeProductForList(doc as unknown as Record<string, unknown>, stockByProduct),
    ),
    totalDocs: result.totalDocs,
    limit: result.limit,
    page: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  })
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canCreateProducts(auth.user)) return forbidden()

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseProductBody(body)

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const payload = await getPayload({ config })

    if (data.subcategory) {
      const subError = await validateSubcategory(payload, data.subcategory, data.category)
      if (subError) return Response.json({ error: subError }, { status: 400 })
    }

    const created = await payload.create({
      collection: 'products',
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        barcode: data.barcode || undefined,
        category: data.category,
        subcategory: data.subcategory || undefined,
        brand: data.brand || undefined,
        supplier: data.supplier || undefined,
        baseUnit: data.baseUnit,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        minStockBase: data.minStockBase,
        weight: data.weight,
        status: data.status ?? 'active',
        active: data.active ?? data.status !== 'inactive',
        images: data.images,
        taxRate: data.taxRate,
        createdBy: auth.user.id,
      },
      depth: 2,
      overrideAccess: false,
      user: auth.user,
    })

    const stockByProduct = await aggregateStockByProduct(payload, [String(created.id)])

    return Response.json(
      {
        doc: sanitizeProductForList(created as unknown as Record<string, unknown>, stockByProduct),
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo crear el producto'
    return Response.json({ error: message }, { status: 400 })
  }
}
