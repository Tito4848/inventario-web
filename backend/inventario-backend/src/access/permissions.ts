import type { User } from '@/payload-types'

import {
  getRoleLabel,
  moduleRoles,
  ROLE_PRIORITY,
  type AppModule,
  type UserRole,
} from './roleMatrix'
import { isAdmin, userHasRole } from './roles'
import { hasAppPanelAccess, isInvitadoOnly } from './usersAccess'

export type { AppModule, InventoryRole, UserRole } from './roleMatrix'
export { getRoleLabel, moduleRoles, ROLE_PRIORITY } from './roleMatrix'

export function getPrimaryRole(user: User | null | undefined): UserRole {
  if (!user?.roles?.length) return 'invitado'
  for (const role of ROLE_PRIORITY) {
    if (userHasRole(user, role)) return role
  }
  return (user.roles[0] as UserRole) || 'invitado'
}

export function canAccessModule(user: User | null | undefined, module: AppModule): boolean {
  if (!user) return false
  if (isAdmin(user)) return true
  const allowed = moduleRoles[module] || []
  return allowed.some((role) => userHasRole(user, role))
}

export function canAccessModuleWithRoles(roles: string[] | null | undefined, module: AppModule): boolean {
  if (!roles?.length) return false
  return canAccessModule({ roles } as User, module)
}

export function getUserModules(user: User | null | undefined): AppModule[] {
  if (!user) return []
  return (Object.keys(moduleRoles) as AppModule[]).filter((m) => canAccessModule(user, m))
}

export function getDefaultAppRouteForRoles(roles: string[] | null | undefined): string {
  if (!roles?.length) return '/login'

  if (isInvitadoOnly(roles)) return '/'

  if (
    canAccessModuleWithRoles(roles, 'portal') &&
    !canAccessModuleWithRoles(roles, 'dashboard')
  ) {
    return '/app/portal'
  }

  if (
    roles.includes('warehouse') &&
    !roles.includes('admin') &&
    !roles.includes('supervisor')
  ) {
    return '/app/stock'
  }

  return '/app'
}

export function hasAdministrativeAppAccess(roles: string[] | null | undefined): boolean {
  return hasAppPanelAccess(roles)
}

export function getDefaultAppRoute(user: User | null | undefined): string {
  if (!user) return '/login'
  return getDefaultAppRouteForRoles(user.roles as string[] | undefined)
}

export function canReadInventoryData(user: User | null | undefined): boolean {
  return canAccessModule(user, 'dashboard')
}

export function canManageUsers(user: User | null | undefined): boolean {
  return canAccessModule(user, 'users')
}

export function formatUserRoles(user: User | null | undefined): string {
  if (!user?.roles?.length) return getRoleLabel('invitado')
  return user.roles.map((r) => getRoleLabel(r as UserRole)).join(', ')
}
