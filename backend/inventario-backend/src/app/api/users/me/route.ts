import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canAccessModule,
  canReadInventoryData,
  getDefaultAppRoute,
  getUserModules,
} from '@/access/permissions'
import {
  canCreateUsers,
  canDeleteUsers,
  canResetUserPassword,
  canViewUsersModule,
} from '@/access/usersAccess'
import {
  canCreateProducts,
  canDeleteProducts,
  canEditProducts,
  canViewProductsModule,
} from '@/access/productsAccess'
import {
  canCreatePurchases,
  canDeletePurchases,
  canReadPurchases,
  canReceivePurchases,
  canReportPurchases,
  canUpdatePurchases,
} from '@/access/purchasesAccess'
import { sanitizeUser } from '@/lib/auth/sanitizeUser'
import type { User } from '@/payload-types'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return Response.json({ user: null, permissions: null }, { status: 401 })
    }

    const u = user as User

    return Response.json({
      user: sanitizeUser(u),
      permissions: {
        modules: getUserModules(u),
        defaultRoute: getDefaultAppRoute(u),
        canReadInventory: canReadInventoryData(u),
        canAccessAnalytics: canAccessModule(u, 'analytics'),
        canViewUsers: canViewUsersModule(u),
        canManageUsers: canCreateUsers(u),
        canDeleteUsers: canDeleteUsers(u),
        canEditUsers: Boolean(u.roles?.includes('admin') || u.roles?.includes('supervisor')),
        canResetPasswords: canResetUserPassword(u),
        canEditOperationalUsers: u.roles?.includes('supervisor') ?? false,
        canViewProducts: canViewProductsModule(u),
        canCreateProducts: canCreateProducts(u),
        canEditProducts: canEditProducts(u),
        canDeleteProducts: canDeleteProducts(u),
        canReadPurchases: canReadPurchases(u),
        canCreatePurchases: canCreatePurchases(u),
        canUpdatePurchases: canUpdatePurchases(u),
        canDeletePurchases: canDeletePurchases(u),
        canReceivePurchases: canReceivePurchases(u),
        canReportPurchases: canReportPurchases(u),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error'
    return Response.json({ error: message }, { status: 500 })
  }
}
