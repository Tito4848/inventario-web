import type { User } from '@/payload-types'

import { canAccessModule } from './permissions'
import { isAdmin, userHasRole } from './roles'

/** sales.read — ver órdenes de venta */
export function canReadSales(user: User | null | undefined): boolean {
  if (!user) return false
  return canAccessModule(user, 'sales')
}

/** sales.create — crear órdenes de venta */
export function canCreateSales(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return (
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'seller')
  )
}

/** sales.update — editar órdenes de venta */
export function canUpdateSales(user: User | null | undefined): boolean {
  return canCreateSales(user)
}

/** sales.delete — eliminar órdenes de venta */
export function canDeleteSales(user: User | null | undefined): boolean {
  return isAdmin(user)
}

/** sales.confirm — confirmar venta comercialmente (sin movimiento de stock) */
export function canConfirmSales(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return (
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'warehouse')
  )
}

/** sales.deliver — entregar venta y generar salidas de stock */
export function canDeliverSales(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return (
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'warehouse')
  )
}

/** sales.report — consultar reportes de ventas */
export function canReportSales(user: User | null | undefined): boolean {
  if (!user) return false
  return canAccessModule(user, 'sales') || canAccessModule(user, 'reports')
}

/** sales.cancel — cancelar ventas antes de entrega */
export function canCancelSales(user: User | null | undefined): boolean {
  return canCreateSales(user)
}

/** sales.return — devolver ventas entregadas */
export function canReturnSales(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return userHasRole(user, 'supervisor') || userHasRole(user, 'warehouse')
}
