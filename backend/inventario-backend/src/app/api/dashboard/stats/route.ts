import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canAccessModule,
  canReadInventoryData,
  getPrimaryRole,
} from '@/access/permissions'
import type { User } from '@/payload-types'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const u = user as User
    const role = getPrimaryRole(u)

    if (!canReadInventoryData(u)) {
      const [mySales] = await Promise.all([
        canAccessModule(u, 'portal') || canAccessModule(u, 'sales')
          ? payload.find({
              collection: 'sales-orders',
              limit: 0,
              overrideAccess: false,
              user: u,
            })
          : Promise.resolve({ totalDocs: 0 }),
      ])

      return Response.json({
        role,
        totalProducts: 0,
        totalCategories: 0,
        totalSuppliers: 0,
        totalUsers: 0,
        totalMovements: 0,
        lowStock: 0,
        outOfStock: 0,
        dailyEntries: 0,
        dailyExits: 0,
        dailyEntriesQty: 0,
        dailyExitsQty: 0,
        monthlySales: 0,
        monthlyPurchases: 0,
        inventoryValue: 0,
        myOrders: mySales.totalDocs,
      })
    }

    const queries: Promise<unknown>[] = [
      payload.count({ collection: 'products', overrideAccess: false, user: u }),
      payload.count({ collection: 'categories', overrideAccess: false, user: u }),
      payload.count({ collection: 'suppliers', overrideAccess: false, user: u }),
    ]

    if (canAccessModule(u, 'users')) {
      queries.push(payload.count({ collection: 'users', overrideAccess: false, user: u }))
    } else {
      queries.push(Promise.resolve({ totalDocs: 0 }))
    }

    queries.push(
      payload.count({ collection: 'stock-movements', overrideAccess: false, user: u }),
      payload.find({
        collection: 'stock-levels',
        limit: 1000,
        depth: 1,
        overrideAccess: false,
        user: u,
      }),
    )

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    queries.push(
      payload.find({
        collection: 'stock-movements',
        limit: 1000,
        depth: 0,
        overrideAccess: false,
        user: u,
        where: {
          and: [
            { date: { greater_than_equal: todayStart.toISOString() } },
            { date: { less_than_equal: todayEnd.toISOString() } },
            { movementType: { in: ['in', 'adjust_in'] } },
          ],
        },
      }),
      payload.find({
        collection: 'stock-movements',
        limit: 1000,
        depth: 0,
        overrideAccess: false,
        user: u,
        where: {
          and: [
            { date: { greater_than_equal: todayStart.toISOString() } },
            { date: { less_than_equal: todayEnd.toISOString() } },
            { movementType: { in: ['out', 'adjust_out'] } },
          ],
        },
      }),
    )

    if (canAccessModule(u, 'purchases')) {
      queries.push(
        payload.find({
          collection: 'purchase-orders',
          limit: 1000,
          depth: 0,
          overrideAccess: false,
          user: u,
          where: {
            orderDate: {
              greater_than_equal: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            },
          },
        }),
      )
    } else {
      queries.push(Promise.resolve({ docs: [] }))
    }

    if (canAccessModule(u, 'sales')) {
      queries.push(
        payload.find({
          collection: 'sales-orders',
          limit: 1000,
          depth: 0,
          overrideAccess: false,
          user: u,
          where: {
            saleDate: {
              greater_than_equal: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            },
          },
        }),
      )
    } else {
      queries.push(Promise.resolve({ docs: [] }))
    }

    const [products, categories, suppliers, users, movements, stockLevels, todayEntries, todayExits, purchaseOrders, salesOrders] =
      (await Promise.all(queries)) as [
        { totalDocs: number },
        { totalDocs: number },
        { totalDocs: number },
        { totalDocs: number },
        { totalDocs: number },
        { docs: Array<{ quantityBase?: number; value?: number; product?: unknown }> },
        { docs: Array<{ quantityBase?: number }> },
        { docs: Array<{ quantityBase?: number }> },
        { docs: Array<{ total?: number }> },
        { docs: Array<{ total?: number }> },
      ]

    let lowStock = 0
    let outOfStock = 0
    let inventoryValue = 0

    for (const level of stockLevels.docs) {
      const qty = level.quantityBase || 0
      inventoryValue += level.value || 0
      const product = typeof level.product === 'object' ? level.product : null
      const min =
        product && typeof product === 'object' && 'minStockBase' in product
          ? Number((product as { minStockBase?: number }).minStockBase) || 0
          : 0
      if (qty <= 0) outOfStock++
      else if (qty <= min) lowStock++
    }

    const monthlyPurchases = purchaseOrders.docs.reduce((sum, o) => sum + (o.total || 0), 0)
    const monthlySales = salesOrders.docs.reduce((sum, o) => sum + (o.total || 0), 0)

    const dailyEntries = todayEntries.docs.length
    const dailyExits = todayExits.docs.length
    const dailyEntriesQty = todayEntries.docs.reduce((sum, m) => sum + (m.quantityBase || 0), 0)
    const dailyExitsQty = todayExits.docs.reduce((sum, m) => sum + (m.quantityBase || 0), 0)

    return Response.json({
      role,
      totalProducts: products.totalDocs,
      totalCategories: categories.totalDocs,
      totalSuppliers: suppliers.totalDocs,
      totalUsers: users.totalDocs,
      totalMovements: movements.totalDocs,
      lowStock,
      outOfStock,
      dailyEntries,
      dailyExits,
      dailyEntriesQty,
      dailyExitsQty,
      monthlySales,
      monthlyPurchases,
      inventoryValue,
      myOrders: 0,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return Response.json({ error: message }, { status: 500 })
  }
}
