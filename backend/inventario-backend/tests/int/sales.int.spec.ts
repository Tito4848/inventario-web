import { describe, expect, it } from 'vitest'

import {
  canCancelSales,
  canConfirmSales,
  canCreateSales,
  canDeleteSales,
  canDeliverSales,
  canReadSales,
  canReportSales,
  canReturnSales,
  canUpdateSales,
} from '@/access/salesAccess'
import { buildSaleListWhere, parseSaleListQuery } from '@/lib/sales/listQuery'
import {
  aggregateDailyRevenue,
  aggregateMonthlyRevenue,
  aggregateSalesByCategory,
  aggregateSalesByCustomer,
  aggregateSalesByDate,
  aggregateSalesByProduct,
  aggregateTopCustomers,
  aggregateTopProducts,
  salesReportToCsv,
} from '@/lib/sales/stats'
import type { SanitizedSale } from '@/lib/sales/sanitize'
import {
  canCancelSaleStatus,
  canConfirmSaleStatus,
  canTransitionToDelivered,
  canTransitionToReturned,
  computeLineTotal,
  computeSaleTotals,
  isEditableSaleStatus,
  normalizeSaleStatus,
  parseConfirmBody,
  parseDeliverBody,
  parseSaleBody,
  parseSaleUpdateBody,
} from '@/lib/sales/validation'
import type { User } from '@/payload-types'

function userWithRoles(roles: string[]): User {
  return { id: '1', email: 'test@test.com', roles } as User
}

const sampleSale = (overrides: Partial<SanitizedSale> = {}): SanitizedSale => ({
  id: '1',
  orderNumber: 'VT-001',
  customer: 'c1',
  customerName: 'Cliente 1',
  status: 'delivered',
  statusLabel: 'Entregada',
  saleDate: '2026-06-15T10:00:00.000Z',
  subtotal: 100,
  tax: 0,
  discountAmount: 0,
  total: 100,
  items: [
    {
      product: 'p1',
      productName: 'Producto 1',
      categoryId: 'cat1',
      categoryName: 'Cat 1',
      quantity: 2,
      unitPrice: 50,
      discount: 0,
      total: 100,
    },
  ],
  createdAt: '2026-06-15T10:00:00.000Z',
  updatedAt: '2026-06-15T10:00:00.000Z',
  ...overrides,
})

describe('sales access (RBAC)', () => {
  it('allows seller to read and create sales', () => {
    expect(canReadSales(userWithRoles(['seller']))).toBe(true)
    expect(canCreateSales(userWithRoles(['seller']))).toBe(true)
  })

  it('allows warehouse to confirm and deliver but not create', () => {
    expect(canConfirmSales(userWithRoles(['warehouse']))).toBe(true)
    expect(canDeliverSales(userWithRoles(['warehouse']))).toBe(true)
    expect(canCreateSales(userWithRoles(['warehouse']))).toBe(false)
  })

  it('allows warehouse to return delivered sales', () => {
    expect(canReturnSales(userWithRoles(['warehouse']))).toBe(true)
    expect(canReturnSales(userWithRoles(['seller']))).toBe(false)
  })

  it('restricts delete to admin', () => {
    expect(canDeleteSales(userWithRoles(['admin']))).toBe(true)
    expect(canDeleteSales(userWithRoles(['supervisor']))).toBe(false)
  })

  it('allows reports for sales and reports modules', () => {
    expect(canReportSales(userWithRoles(['seller']))).toBe(true)
    expect(canReportSales(userWithRoles(['viewer']))).toBe(true)
  })

  it('maps sales.update and cancel to seller and supervisor', () => {
    expect(canUpdateSales(userWithRoles(['supervisor']))).toBe(true)
    expect(canCancelSales(userWithRoles(['seller']))).toBe(true)
  })
})

describe('sales validation', () => {
  it('rejects negative quantities and prices', () => {
    const result = parseSaleBody({
      customer: 'c1',
      saleDate: new Date().toISOString(),
      items: [{ product: 'p1', quantity: -1, unitPrice: 10 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing customer', () => {
    const result = parseSaleBody({
      customer: '',
      saleDate: new Date().toISOString(),
      items: [{ product: 'p1', quantity: 1, unitPrice: 10 }],
    })
    expect(result.success).toBe(false)
  })

  it('computes totals with percentage discounts', () => {
    const items = [{ product: 'p1', quantity: 2, unitPrice: 100, discount: 10 }]
    expect(computeLineTotal(items[0])).toBe(180)
    expect(computeSaleTotals(items, 0, 18)).toEqual({ subtotal: 180, total: 198 })
  })

  it('validates confirm and deliver payloads', () => {
    expect(parseConfirmBody({ rack: 'rack1', notes: 'OK' }).success).toBe(true)
    expect(parseDeliverBody({ rack: 'rack1', notes: 'Despacho' }).success).toBe(true)
  })

  it('checks status helpers', () => {
    expect(isEditableSaleStatus('draft')).toBe(true)
    expect(isEditableSaleStatus('confirmed')).toBe(false)
    expect(isEditableSaleStatus('delivered')).toBe(false)
    expect(canConfirmSaleStatus('pending')).toBe(true)
    expect(canConfirmSaleStatus('cancelled')).toBe(false)
    expect(canCancelSaleStatus('draft')).toBe(true)
    expect(canCancelSaleStatus('confirmed')).toBe(true)
    expect(canCancelSaleStatus('delivered')).toBe(false)
    expect(canTransitionToDelivered('confirmed')).toBe(true)
    expect(canTransitionToDelivered('pending')).toBe(false)
    expect(canTransitionToReturned('delivered')).toBe(true)
    expect(normalizeSaleStatus('unknown')).toBe('draft')
  })

  it('parses sale update body for draft/pending only', () => {
    const result = parseSaleUpdateBody({ status: 'pending' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('pending')
  })
})

describe('sales list query', () => {
  it('builds filters for pending sales', () => {
    const query = parseSaleListQuery(
      new URL('http://localhost/api/sales?pending=true&customer=abc&search=VT'),
    )
    expect(query.pending).toBe(true)
    expect(query.customer).toBe('abc')
    expect(query.search).toBe('VT')

    const where = buildSaleListWhere(query)
    expect(where).toBeTruthy()
  })
})

describe('sales reports', () => {
  const docs = [
    sampleSale(),
    sampleSale({
      id: '2',
      orderNumber: 'VT-002',
      saleDate: '2026-06-16T10:00:00.000Z',
      customer: 'c2',
      customerName: 'Cliente 2',
      total: 200,
      items: [
        {
          product: 'p2',
          productName: 'Producto 2',
          categoryId: 'cat2',
          categoryName: 'Cat 2',
          quantity: 4,
          unitPrice: 50,
          discount: 0,
          total: 200,
        },
      ],
    }),
    sampleSale({ id: '3', status: 'draft', statusLabel: 'Borrador', total: 50 }),
    sampleSale({ id: '4', status: 'confirmed', statusLabel: 'Confirmada', total: 75 }),
  ]

  it('aggregates by date for delivered sales', () => {
    const rows = aggregateSalesByDate(docs)
    expect(rows.length).toBe(2)
    expect(rows[0].count).toBe(1)
  })

  it('aggregates by customer', () => {
    const rows = aggregateSalesByCustomer(docs)
    expect(rows.length).toBe(2)
    expect(rows[0].total).toBeGreaterThanOrEqual(rows[1].total)
  })

  it('aggregates by product and category', () => {
    expect(aggregateSalesByProduct(docs).length).toBe(2)
    expect(aggregateSalesByCategory(docs).length).toBe(2)
  })

  it('aggregates top products and customers', () => {
    expect(aggregateTopProducts(docs, 1).length).toBe(1)
    expect(aggregateTopCustomers(docs, 1)[0].customerId).toBeTruthy()
  })

  it('aggregates daily and monthly revenue from delivered sales', () => {
    expect(aggregateDailyRevenue(docs)[0].revenue).toBe(100)
    expect(aggregateMonthlyRevenue(docs)[0].month).toBe('2026-06')
  })

  it('exports CSV', () => {
    const csv = salesReportToCsv('test', [{ a: '1', b: 'hello, world' }])
    expect(csv).toContain('"hello, world"')
  })
})

describe('sales confirm guards', () => {
  it('blocks confirming cancelled or delivered sales', () => {
    expect(canConfirmSaleStatus('cancelled')).toBe(false)
    expect(canConfirmSaleStatus('delivered')).toBe(false)
    expect(canConfirmSaleStatus('confirmed')).toBe(false)
  })
})

describe('sales deliver guards', () => {
  it('only allows deliver from confirmed status', () => {
    expect(canTransitionToDelivered('confirmed')).toBe(true)
    expect(canTransitionToDelivered('pending')).toBe(false)
    expect(canTransitionToDelivered('delivered')).toBe(false)
  })
})

describe('sales cancel guards', () => {
  it('allows cancel before delivery', () => {
    expect(canCancelSaleStatus('confirmed')).toBe(true)
    expect(canCancelSaleStatus('delivered')).toBe(false)
    expect(canCancelSaleStatus('returned')).toBe(false)
  })
})

describe('sales audit actions', () => {
  it('uses expected audit action names', () => {
    const actions = [
      'sale.create',
      'sale.update',
      'sale.confirm',
      'sale.deliver',
      'sale.cancel',
      'sale.delete',
      'sale.return',
    ]
    expect(actions).toHaveLength(7)
    expect(actions.every((a) => a.startsWith('sale.'))).toBe(true)
  })
})

describe('sales inventory integration', () => {
  it('confirm requires draft or pending status only', () => {
    expect(canConfirmSaleStatus('draft')).toBe(true)
    expect(canConfirmSaleStatus('pending')).toBe(true)
    expect(canConfirmSaleStatus('delivered')).toBe(false)
  })

  it('stock exit happens only on deliver (confirmed prerequisite)', () => {
    expect(canTransitionToDelivered('confirmed')).toBe(true)
    expect(canTransitionToDelivered('draft')).toBe(false)
  })

  it('return requires delivered status', () => {
    expect(canTransitionToReturned('delivered')).toBe(true)
    expect(canTransitionToReturned('confirmed')).toBe(false)
  })
})
