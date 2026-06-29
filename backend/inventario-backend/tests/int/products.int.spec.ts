import { describe, expect, it } from 'vitest'

import {
  canCreateProducts,
  canDeleteProducts,
  canEditProducts,
  canToggleProductStatus,
  canViewProductsModule,
} from '@/access/productsAccess'
import { buildProductListWhere, parseProductListQuery } from '@/lib/products/listQuery'
import { parseProductBody } from '@/lib/products/validation'
import type { User } from '@/payload-types'

function userWithRoles(roles: string[]): User {
  return { id: '1', email: 'test@test.com', roles } as User
}

describe('products access', () => {
  it('allows inventory roles to view products', () => {
    expect(canViewProductsModule(userWithRoles(['warehouse']))).toBe(true)
    expect(canViewProductsModule(userWithRoles(['viewer']))).toBe(true)
  })

  it('restricts create/edit to admin and supervisor', () => {
    expect(canCreateProducts(userWithRoles(['admin']))).toBe(true)
    expect(canCreateProducts(userWithRoles(['supervisor']))).toBe(true)
    expect(canCreateProducts(userWithRoles(['warehouse']))).toBe(false)
    expect(canEditProducts(userWithRoles(['warehouse']))).toBe(false)
  })

  it('allows only admin to delete products', () => {
    expect(canDeleteProducts(userWithRoles(['admin']))).toBe(true)
    expect(canDeleteProducts(userWithRoles(['supervisor']))).toBe(false)
  })

  it('allows supervisor to toggle product status', () => {
    expect(canToggleProductStatus(userWithRoles(['supervisor']))).toBe(true)
    expect(canToggleProductStatus(userWithRoles(['warehouse']))).toBe(false)
  })
})

describe('products validation', () => {
  it('rejects negative prices', () => {
    const result = parseProductBody({
      code: 'SKU-1',
      name: 'Producto',
      category: 'cat1',
      baseUnit: 'unit1',
      purchasePrice: -1,
      salePrice: 10,
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid product input', () => {
    const result = parseProductBody({
      code: 'SKU-1',
      name: 'Producto',
      category: 'cat1',
      baseUnit: 'unit1',
      purchasePrice: 5,
      salePrice: 10,
      minStockBase: 2,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('SKU-1')
      expect(result.data.minStockBase).toBe(2)
    }
  })
})

describe('products list query', () => {
  it('builds search filters', () => {
    const query = parseProductListQuery(
      new URL('http://localhost/api/products/manage?search=laptop&status=active&page=2'),
    )
    expect(query.search).toBe('laptop')
    expect(query.status).toBe('active')
    expect(query.page).toBe(2)

    const where = buildProductListWhere(query)
    expect(where).toHaveProperty('and')
  })
})
