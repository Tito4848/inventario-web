import { describe, expect, it } from 'vitest'

import {
  canAccessModule,
  canAccessModuleWithRoles,
  getDefaultAppRouteForRoles,
  getPrimaryRole,
  hasAdministrativeAppAccess,
} from '@/access/permissions'
import { isInvitadoOnly } from '@/access/usersAccess'
import { isAdmin, isClientRole, userHasRole } from '@/access/roles'
import type { User } from '@/payload-types'

function userWithRoles(roles: string[]): User {
  return { id: '1', email: 'test@test.com', roles } as User
}

describe('RBAC roles', () => {
  it('resolves the five canonical roles', () => {
    expect(getPrimaryRole(userWithRoles(['admin']))).toBe('admin')
    expect(getPrimaryRole(userWithRoles(['supervisor']))).toBe('supervisor')
    expect(getPrimaryRole(userWithRoles(['warehouse']))).toBe('warehouse')
    expect(getPrimaryRole(userWithRoles(['client']))).toBe('client')
    expect(getPrimaryRole(userWithRoles(['invitado']))).toBe('invitado')
  })

  it('maps legacy guest to client permissions', () => {
    const guest = userWithRoles(['guest'])
    expect(isClientRole(guest)).toBe(true)
    expect(canAccessModule(guest, 'portal')).toBe(true)
    expect(canAccessModule(guest, 'dashboard')).toBe(false)
  })

  it('grants admin full module access', () => {
    const admin = userWithRoles(['admin'])
    expect(isAdmin(admin)).toBe(true)
    expect(canAccessModule(admin, 'users')).toBe(true)
    expect(canAccessModule(admin, 'audit')).toBe(true)
  })

  it('restricts invitado to public-only access', () => {
    const invitado = userWithRoles(['invitado'])
    expect(isInvitadoOnly(['invitado'])).toBe(true)
    expect(hasAdministrativeAppAccess(['invitado'])).toBe(false)
    expect(canAccessModule(invitado, 'dashboard')).toBe(false)
    expect(canAccessModule(invitado, 'settings')).toBe(false)
    expect(canAccessModule(invitado, 'users')).toBe(false)
    expect(canAccessModule(invitado, 'notifications')).toBe(false)
    expect(getDefaultAppRouteForRoles(['invitado'])).toBe('/')
  })

  it('allows warehouse to view users module read-only', () => {
    const warehouse = userWithRoles(['warehouse'])
    expect(canAccessModule(warehouse, 'users')).toBe(true)
    expect(canAccessModule(warehouse, 'stock')).toBe(true)
  })

  it('scopes warehouse to inventory operations', () => {
    const warehouse = userWithRoles(['warehouse'])
    expect(canAccessModule(warehouse, 'stock')).toBe(true)
    expect(canAccessModule(warehouse, 'movements')).toBe(true)
    expect(canAccessModule(warehouse, 'analytics')).toBe(false)
  })

  it('supports middleware role checks via JWT role arrays', () => {
    expect(canAccessModuleWithRoles(['client'], 'portal')).toBe(true)
    expect(canAccessModuleWithRoles(['guest'], 'portal')).toBe(true)
    expect(canAccessModuleWithRoles(['invitado'], 'portal')).toBe(false)
    expect(canAccessModuleWithRoles(['invitado'], 'dashboard')).toBe(false)
    expect(canAccessModuleWithRoles(['warehouse'], 'stock')).toBe(true)
    expect(canAccessModuleWithRoles(['warehouse'], 'users')).toBe(true)
  })

  it('computes default routes per role', () => {
    expect(getDefaultAppRouteForRoles(['client'])).toBe('/app/portal')
    expect(getDefaultAppRouteForRoles(['guest'])).toBe('/app/portal')
    expect(getDefaultAppRouteForRoles(['warehouse'])).toBe('/app/stock')
    expect(getDefaultAppRouteForRoles(['admin'])).toBe('/app')
    expect(getDefaultAppRouteForRoles(['invitado'])).toBe('/')
  })

  it('preserves legacy seller and operator permissions', () => {
    expect(userHasRole(userWithRoles(['seller']), 'supervisor')).toBe(false)
    expect(canAccessModule(userWithRoles(['seller']), 'sales')).toBe(true)
    expect(canAccessModule(userWithRoles(['seller']), 'analytics')).toBe(false)
    expect(canAccessModule(userWithRoles(['operator']), 'purchases')).toBe(true)
    expect(canAccessModule(userWithRoles(['viewer']), 'products')).toBe(true)
  })
})
