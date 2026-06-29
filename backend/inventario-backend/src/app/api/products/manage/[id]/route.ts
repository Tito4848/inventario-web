import { getPayload } from 'payload'
import config from '@payload-config'

import { canCreateProducts, canDeleteProducts } from '@/access/productsAccess'
import {
  aggregateStockByProduct,
  sanitizeProductForList,
} from '@/lib/products/sanitize'
import { parseProductBody } from '@/lib/products/validation'
import { requireAuth } from '@/lib/auth/requireAuth'

import { getTargetProduct } from '@/lib/products/targetProduct'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireAuth(_req)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const target = await getTargetProduct(id, auth.user)
  if (target instanceof Response) return target

  const payload = await getPayload({ config })
  const stockByProduct = await aggregateStockByProduct(payload, [id])

  return Response.json({
    doc: sanitizeProductForList(target, stockByProduct),
  })
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canCreateProducts(auth.user)) return forbidden()

  const { id } = await context.params
  const target = await getTargetProduct(id, auth.user)
  if (target instanceof Response) return target

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseProductBody({
      code: body.code ?? target.code,
      name: body.name ?? target.name,
      description: body.description ?? target.description,
      barcode: body.barcode ?? target.barcode,
      category:
        body.category ??
        (typeof target.category === 'object' ? (target.category as { id: string }).id : target.category),
      subcategory:
        body.subcategory ??
        (target.subcategory
          ? typeof target.subcategory === 'object'
            ? (target.subcategory as { id: string }).id
            : target.subcategory
          : undefined),
      brand:
        body.brand ??
        (target.brand
          ? typeof target.brand === 'object'
            ? (target.brand as { id: string }).id
            : target.brand
          : undefined),
      supplier:
        body.supplier ??
        (target.supplier
          ? typeof target.supplier === 'object'
            ? (target.supplier as { id: string }).id
            : target.supplier
          : undefined),
      baseUnit:
        body.baseUnit ??
        (typeof target.baseUnit === 'object' ? (target.baseUnit as { id: string }).id : target.baseUnit),
      purchasePrice: body.purchasePrice ?? target.purchasePrice,
      salePrice: body.salePrice ?? target.salePrice,
      minStockBase: body.minStockBase ?? target.minStockBase,
      weight: body.weight ?? target.weight,
      status: body.status ?? target.status,
      active: body.active ?? target.active,
      images: body.images,
      taxRate: body.taxRate ?? target.taxRate,
    })

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join('. ')
      return Response.json({ error: message }, { status: 400 })
    }

    const data = parsed.data
    const payload = await getPayload({ config })

    const updated = await payload.update({
      collection: 'products',
      id,
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
        ...(body.images !== undefined ? { images: data.images } : {}),
        taxRate: data.taxRate,
      },
      depth: 2,
      overrideAccess: false,
      user: auth.user,
    })

    const stockByProduct = await aggregateStockByProduct(payload, [id])

    return Response.json({
      doc: sanitizeProductForList(updated as unknown as Record<string, unknown>, stockByProduct),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo actualizar el producto'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAuth(_req)
  if (auth instanceof Response) return auth

  if (!canDeleteProducts(auth.user)) return forbidden()

  const { id } = await context.params
  const target = await getTargetProduct(id, auth.user)
  if (target instanceof Response) return target

  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'products',
    id,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({ message: 'Producto eliminado' })
}
