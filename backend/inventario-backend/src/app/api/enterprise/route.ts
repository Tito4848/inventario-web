import { getPayload } from 'payload'
import config from '@payload-config'

import { canReadInventory } from '@/access/roles'
import type { Config, User } from '@/payload-types'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user || !canReadInventory(user as User)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collections: Array<keyof Config['collections']> = [
      'products',
      'categories',
      'subcategories',
      'suppliers',
      'customers',
      'purchase-orders',
      'sales-orders',
      'stock-movements',
      'stock-levels',
      'stock-lots',
      'kardex-entries',
      'audit-logs',
      'notifications',
      'settings',
    ]

    const results = await Promise.all(
      collections.map(async (slug) => {
        const docs = await payload.find({ collection: slug, limit: 5, overrideAccess: false, user: user as User })
        return { slug, count: docs.totalDocs, sample: docs.docs.slice(0, 3) }
      }),
    )

    return Response.json({ ok: true, collections: results })
  } catch (error: unknown) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
