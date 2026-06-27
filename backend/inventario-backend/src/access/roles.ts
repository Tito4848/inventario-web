import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

import {
  inventoryReadRoles,
  inventoryWriteRoles,
  LEGACY_ROLE_ALIASES,
  type InventoryRole,
  type LegacyRole,
  type UserRole,
} from './roleMatrix'
import { canViewUsersModule, isOperationalUser } from './usersAccess'

export type { InventoryRole, LegacyRole, UserRole } from './roleMatrix'

function normalizeUserRoles(user: User | null | undefined): UserRole[] {
  if (!user?.roles?.length) return []
  return user.roles as UserRole[]
}

export function userHasRole(user: User | null | undefined, role: UserRole): boolean {
  const roles = normalizeUserRoles(user)
  if (roles.includes(role)) return true

  for (const assigned of roles) {
    const aliases = LEGACY_ROLE_ALIASES[assigned as LegacyRole]
    if (aliases?.includes(role as InventoryRole)) return true
  }

  return false
}

export function userHasAnyRole(user: User | null | undefined, allowed: UserRole[]): boolean {
  return allowed.some((role) => userHasRole(user, role))
}

export function isAdmin(user: User | null | undefined): boolean {
  return userHasRole(user, 'admin')
}

export function isClientRole(user: User | null | undefined): boolean {
  return userHasRole(user, 'client') || userHasRole(user, 'guest')
}

export function canReadInventory(user: User | null | undefined): boolean {
  return Boolean(user) && userHasAnyRole(user, inventoryReadRoles)
}

export function canWriteInventory(user: User | null | undefined): boolean {
  return Boolean(user) && userHasAnyRole(user, inventoryWriteRoles)
}

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const inventoryReadAccess: Access = ({ req }) => canReadInventory(req.user)

export const inventoryWriteAccess: Access = ({ req }) => canWriteInventory(req.user)

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

export const adminOrSupervisor: Access = ({ req }) =>
  isAdmin(req.user) || userHasRole(req.user, 'supervisor')

function getCustomerProfileId(user: User | null | undefined): string | null {
  const profile = (user as User & { customerProfile?: string | { id: string } })?.customerProfile
  if (!profile) return null
  return typeof profile === 'object' ? String(profile.id) : String(profile)
}

export const salesOrdersReadAccess: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (canReadInventory(user) && !isClientRole(user)) return true

  if (isClientRole(user)) {
    const customerId = getCustomerProfileId(user)
    if (customerId) return { customer: { equals: customerId } } as Where
    return { createdBy: { equals: user.id } } as Where
  }

  if (userHasRole(user, 'seller')) {
    return {
      or: [{ createdBy: { equals: user.id } }, { status: { not_equals: 'draft' } }],
    } as Where
  }

  return false
}

export const salesOrdersWriteAccess: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (isAdmin(user) || userHasRole(user, 'supervisor') || userHasRole(user, 'operator')) return true
  if (userHasRole(user, 'seller')) return true
  return false
}

export const customersReadAccess: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (canReadInventory(user) && !isClientRole(user)) return true

  if (isClientRole(user)) {
    const customerId = getCustomerProfileId(user)
    if (customerId) return { id: { equals: customerId } } as Where
    return { email: { equals: user.email } } as Where
  }

  return false
}

export const customersWriteAccess: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (isAdmin(user) || userHasRole(user, 'supervisor') || userHasRole(user, 'operator')) return true
  if (userHasRole(user, 'seller')) return true
  return false
}

export const auditReadAccess: Access = ({ req }) => adminOrSupervisor({ req })

export const usersReadAccess: Access = ({ req }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (canViewUsersModule(user)) return true
  return { id: { equals: user.id } } as Where
}

export const usersCreateAccess: Access = ({ req: { user }, data }) => {
  if (isAdmin(user)) return true
  if (!user && data?.roles?.length === 1) {
    const role = String(data.roles[0])
    if (role === 'client' || role === 'guest' || role === 'invitado') return true
  }
  return false
}

export const usersUpdateAccess: Access = async ({ req, id }) => {
  const user = req.user as User | undefined
  if (!user) return false
  if (isAdmin(user)) return true
  if (user.id === id) return true

  if (userHasRole(user, 'supervisor') && id) {
    const target = await req.payload.findByID({
      collection: 'users',
      id: String(id),
      depth: 0,
      overrideAccess: true,
    })
    return isOperationalUser((target as User).roles as string[])
  }

  return false
}

export const usersDeleteAccess: Access = ({ req }) => isAdmin(req.user)
