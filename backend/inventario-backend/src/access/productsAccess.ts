import type { User } from '@/payload-types'

import { canAccessModule } from './permissions'
import { isAdmin, userHasRole } from './roles'

/** Lectura del módulo productos (panel / catálogo interno) */
export function canViewProductsModule(user: User | null | undefined): boolean {
  if (!user) return false
  return canAccessModule(user, 'products')
}

/** Crear productos: administrador y supervisor (+ operador legacy) */
export function canCreateProducts(user: User | null | undefined): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  return userHasRole(user, 'supervisor') || userHasRole(user, 'operator')
}

/** Editar productos: administrador y supervisor (+ operador legacy) */
export function canEditProducts(user: User | null | undefined): boolean {
  return canCreateProducts(user)
}

/** Eliminar productos: solo administrador */
export function canDeleteProducts(user: User | null | undefined): boolean {
  return isAdmin(user)
}

/** Activar / desactivar productos */
export function canToggleProductStatus(user: User | null | undefined): boolean {
  return canCreateProducts(user)
}
