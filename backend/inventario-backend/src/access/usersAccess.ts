import type { User } from '@/payload-types'

import { isAdmin, userHasRole } from './roles'

/** Roles con acceso al panel administrativo /app */
export const APP_ACCESS_ROLES = [
  'admin',
  'supervisor',
  'warehouse',
  'client',
  'guest',
  'seller',
  'operator',
  'viewer',
] as const

/** Roles que no pueden acceder al panel administrativo */
export const PUBLIC_ONLY_ROLES = ['invitado'] as const

/** Roles considerados críticos (solo admin puede crearlos/modificarlos) */
export const CRITICAL_ROLES = ['admin', 'supervisor'] as const

/** Roles operativos editables por supervisor */
export const OPERATIONAL_ROLES = [
  'warehouse',
  'client',
  'invitado',
  'guest',
  'seller',
  'operator',
  'viewer',
] as const

export type CriticalRole = (typeof CRITICAL_ROLES)[number]
export type OperationalRole = (typeof OPERATIONAL_ROLES)[number]

export function hasCriticalRole(roles: string[] | null | undefined): boolean {
  if (!roles?.length) return false
  return roles.some((r) => (CRITICAL_ROLES as readonly string[]).includes(r))
}

export function isOperationalUser(roles: string[] | null | undefined): boolean {
  if (!roles?.length) return false
  if (hasCriticalRole(roles)) return false
  return roles.some((r) => (OPERATIONAL_ROLES as readonly string[]).includes(r))
}

export function isInvitadoOnly(roles: string[] | null | undefined): boolean {
  if (!roles?.length) return true
  const appRoles = roles.filter(
    (r) =>
      (APP_ACCESS_ROLES as readonly string[]).includes(r) ||
      (CRITICAL_ROLES as readonly string[]).includes(r),
  )
  return appRoles.length === 0 && roles.includes('invitado')
}

export function hasAppPanelAccess(roles: string[] | null | undefined): boolean {
  if (!roles?.length) return false
  if (isInvitadoOnly(roles)) return false
  return roles.some(
    (r) =>
      (APP_ACCESS_ROLES as readonly string[]).includes(r) ||
      (CRITICAL_ROLES as readonly string[]).includes(r),
  )
}

export function canViewUsersModule(user: User | null | undefined): boolean {
  if (!user) return false
  return (
    isAdmin(user) || userHasRole(user, 'supervisor') || userHasRole(user, 'warehouse')
  )
}

export function canCreateUsers(user: User | null | undefined): boolean {
  return isAdmin(user)
}

export function canDeleteUsers(user: User | null | undefined): boolean {
  return isAdmin(user)
}

export function canEditUser(actor: User | null | undefined, targetRoles: string[]): boolean {
  if (!actor) return false
  if (isAdmin(actor)) return true
  if (userHasRole(actor, 'supervisor') && isOperationalUser(targetRoles)) return true
  return false
}

export function canAssignRoles(actor: User | null | undefined): boolean {
  return isAdmin(actor)
}

export function canAssignAdminRole(actor: User | null | undefined, roles: string[]): boolean {
  if (!isAdmin(actor)) return false
  return roles.includes('admin')
}

export function canToggleUserStatus(actor: User | null | undefined, targetRoles: string[]): boolean {
  if (!actor) return false
  if (isAdmin(actor)) return true
  if (userHasRole(actor, 'supervisor') && isOperationalUser(targetRoles)) return true
  return false
}

export function canResetUserPassword(actor: User | null | undefined): boolean {
  return isAdmin(actor)
}

export function assertRolesAllowed(actor: User, roles: string[]): void {
  if (!canAssignRoles(actor)) {
    throw new Error('No tiene permiso para asignar roles')
  }
  if (roles.includes('admin') && !isAdmin(actor)) {
    throw new Error('Solo un administrador puede asignar el rol Administrador')
  }
  if (roles.includes('supervisor') && !isAdmin(actor)) {
    throw new Error('Solo un administrador puede asignar el rol Supervisor')
  }
}

export function sanitizeUserForList(user: User): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName ?? null,
    roles: user.roles,
    status: (user as User & { status?: string }).status ?? 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: (user as User & { lastLoginAt?: string }).lastLoginAt ?? null,
  }
}
