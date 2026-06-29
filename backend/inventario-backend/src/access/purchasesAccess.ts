import type { User } from '@/payload-types'

import { canAccessModule } from './permissions'
import { isAdmin, userHasRole } from './roles'

/** purchase.read — ver órdenes de compra */
export function canReadPurchases(user: User | null | undefined): boolean {
  if (!user) return false
  return canAccessModule(user, 'purchases')
}

/** purchase.create — crear órdenes */
export function canCreatePurchases(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return userHasRole(user, 'supervisor') || userHasRole(user, 'operator')
}

/** purchase.update — editar órdenes */
export function canUpdatePurchases(user: User | null | undefined): boolean {
  return canCreatePurchases(user)
}

/** purchase.delete — eliminar órdenes */
export function canDeletePurchases(user: User | null | undefined): boolean {
  return isAdmin(user)
}

/** purchase.receive — recepcionar mercadería */
export function canReceivePurchases(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return (
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'warehouse')
  )
}

/** purchase.report — consultar reportes de compras */
export function canReportPurchases(user: User | null | undefined): boolean {
  if (!user) return false
  return canAccessModule(user, 'purchases') || canAccessModule(user, 'reports')
}
