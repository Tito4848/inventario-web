import type { Access } from 'payload'

import type { User } from '@/payload-types'

export type InventoryRole = 'admin' | 'operator' | 'viewer'

export function userHasRole(user: User | null | undefined, role: InventoryRole): boolean {
  const roles = user?.roles as InventoryRole[] | undefined
  return Array.isArray(roles) && roles.includes(role)
}

export function isAdmin(user: User | null | undefined): boolean {
  return userHasRole(user, 'admin')
}

export function canReadInventory(user: User | null | undefined): boolean {
  return Boolean(user) && (userHasRole(user, 'admin') || userHasRole(user, 'operator') || userHasRole(user, 'viewer'))
}

export function canWriteInventory(user: User | null | undefined): boolean {
  return Boolean(user) && (userHasRole(user, 'admin') || userHasRole(user, 'operator'))
}

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const inventoryReadAccess: Access = ({ req }) => canReadInventory(req.user)

export const inventoryWriteAccess: Access = ({ req }) => canWriteInventory(req.user)

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

