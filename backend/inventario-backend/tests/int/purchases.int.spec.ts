import { describe, expect, it } from 'vitest'

import {
  canCreatePurchases,
  canDeletePurchases,
  canReadPurchases,
  canReceivePurchases,
  canReportPurchases,
  canUpdatePurchases,
} from '@/access/purchasesAccess'
import { buildPurchaseListWhere, parsePurchaseListQuery } from '@/lib/purchases/listQuery'
import {
  canReceiveStatus,
  computeLineSubtotal,
  computePurchaseTotals,
  isEditableStatus,
  normalizePurchaseStatus,
  parsePurchaseBody,
  parseReceiveBody,
} from '@/lib/purchases/validation'
import type { User } from '@/payload-types'

function userWithRoles(roles: string[]): User {
  return { id: '1', email: 'test@test.com', roles } as User
}

describe('purchases access', () => {
  it('allows operator to read and create purchases', () => {
    expect(canReadPurchases(userWithRoles(['operator']))).toBe(true)
    expect(canCreatePurchases(userWithRoles(['operator']))).toBe(true)
  })

  it('allows warehouse to receive but not create', () => {
    expect(canReceivePurchases(userWithRoles(['warehouse']))).toBe(true)
    expect(canCreatePurchases(userWithRoles(['warehouse']))).toBe(false)
  })

  it('restricts delete to admin', () => {
    expect(canDeletePurchases(userWithRoles(['admin']))).toBe(true)
    expect(canDeletePurchases(userWithRoles(['supervisor']))).toBe(false)
  })

  it('allows reports for purchases and reports modules', () => {
    expect(canReportPurchases(userWithRoles(['operator']))).toBe(true)
    expect(canReportPurchases(userWithRoles(['viewer']))).toBe(true)
  })

  it('maps purchase.update to supervisor', () => {
    expect(canUpdatePurchases(userWithRoles(['supervisor']))).toBe(true)
  })
})

describe('purchases validation', () => {
  it('rejects negative quantities and prices', () => {
    const result = parsePurchaseBody({
      supplier: 'sup1',
      orderDate: new Date().toISOString(),
      items: [{ product: 'p1', quantity: -1, unitCost: 10 }],
    })
    expect(result.success).toBe(false)
  })

  it('computes totals with discounts', () => {
    const items = [{ product: 'p1', quantity: 2, unitCost: 10, discount: 3 }]
    expect(computeLineSubtotal(items[0])).toBe(17)
    expect(computePurchaseTotals(items, 2, 1)).toEqual({ subtotal: 17, total: 16 })
  })

  it('validates receive payload', () => {
    const ok = parseReceiveBody({
      rack: 'rack1',
      items: [{ product: 'p1', quantity: 5 }],
    })
    expect(ok.success).toBe(true)

    const bad = parseReceiveBody({ rack: '', items: [] })
    expect(bad.success).toBe(false)
  })

  it('normalizes legacy statuses', () => {
    expect(normalizePurchaseStatus('sent')).toBe('pending')
    expect(normalizePurchaseStatus('invoiced')).toBe('received')
  })

  it('checks editable and receivable statuses', () => {
    expect(isEditableStatus('draft')).toBe(true)
    expect(isEditableStatus('received')).toBe(false)
    expect(canReceiveStatus('partial')).toBe(true)
    expect(canReceiveStatus('cancelled')).toBe(false)
  })
})

describe('purchases list query', () => {
  it('builds filters for pending purchases', () => {
    const query = parsePurchaseListQuery(
      new URL('http://localhost/api/purchases?pending=true&supplier=abc&search=OC'),
    )
    expect(query.pending).toBe(true)
    expect(query.supplier).toBe('abc')
    expect(query.search).toBe('OC')

    const where = buildPurchaseListWhere(query)
    expect(where).toBeTruthy()
  })
})
