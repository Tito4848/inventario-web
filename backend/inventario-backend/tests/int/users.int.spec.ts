import { describe, expect, it } from 'vitest'

import {
  canCreateUsers,
  canDeleteUsers,
  canEditUser,
  canViewUsersModule,
  isOperationalUser,
} from '@/access/usersAccess'
import { buildUserListWhere } from '@/lib/users/listQuery'
import type { User } from '@/payload-types'

function userWithRoles(roles: string[]): User {
  return { id: '1', email: 'test@test.com', roles } as User
}

describe('users access', () => {
  it('allows admin full user management', () => {
    const admin = userWithRoles(['admin'])
    expect(canViewUsersModule(admin)).toBe(true)
    expect(canCreateUsers(admin)).toBe(true)
    expect(canDeleteUsers(admin)).toBe(true)
    expect(canEditUser(admin, ['warehouse'])).toBe(true)
    expect(canEditUser(admin, ['supervisor'])).toBe(true)
  })

  it('allows supervisor to view and edit operational users only', () => {
    const supervisor = userWithRoles(['supervisor'])
    expect(canViewUsersModule(supervisor)).toBe(true)
    expect(canCreateUsers(supervisor)).toBe(false)
    expect(canDeleteUsers(supervisor)).toBe(false)
    expect(canEditUser(supervisor, ['warehouse'])).toBe(true)
    expect(canEditUser(supervisor, ['admin'])).toBe(false)
  })

  it('allows warehouse read-only module access', () => {
    const warehouse = userWithRoles(['warehouse'])
    expect(canViewUsersModule(warehouse)).toBe(true)
    expect(canCreateUsers(warehouse)).toBe(false)
    expect(canEditUser(warehouse, ['client'])).toBe(false)
  })

  it('identifies operational users', () => {
    expect(isOperationalUser(['warehouse'])).toBe(true)
    expect(isOperationalUser(['admin'])).toBe(false)
    expect(isOperationalUser(['supervisor', 'warehouse'])).toBe(false)
  })
})

describe('users list query', () => {
  it('builds search filters', () => {
    const where = buildUserListWhere({
      page: 1,
      limit: 10,
      sort: '-createdAt',
      search: 'admin',
      status: 'active',
      role: 'warehouse',
    })

    expect(where).toHaveProperty('and')
  })
})
