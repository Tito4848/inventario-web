import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim()
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)))

  const payload = await getPayload({ config })

  const where: Where = search
    ? {
        and: [
          { active: { equals: true } },
          {
            or: [
              { name: { contains: search } },
              { code: { contains: search } },
              { description: { contains: search } },
            ],
          },
        ],
      }
    : { active: { equals: true } }

  const products = await payload.find({
    collection: 'products',
    where,
    limit,
    sort: 'name',
    depth: 1,
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      salePrice: true,
      active: true,
    },
  })

  return Response.json({
    docs: products.docs,
    totalDocs: products.totalDocs,
    limit: products.limit,
    page: products.page,
    totalPages: products.totalPages,
  })
}
