import type { Payload } from 'payload'

import { writeAuditLogWithPayload } from '@/lib/audit/logAction'
import { receivePurchaseOrder } from '@/lib/purchases/receive'

import { TARGETS } from '../lib/constants'
import {
  countDocs,
  createSeedReq,
  logCount,
  logPhase,
  padCode,
  randomDateInLastMonths,
  seedNotes,
  upsertByField,
} from '../lib/helpers'
import type { SeedContext } from './foundation'

type MovementType = 'in' | 'out' | 'adjust_in' | 'adjust_out'

async function createStockMovement(
  payload: SeedContext['payload'],
  input: {
    label: string
    movementType: MovementType
    date: string
    product: string
    rack: string
    quantity: number
    unit: string
    unitCost?: number
    notes?: string
    createdBy?: string
  },
): Promise<void> {
  const { movementType, unitCost, ...rest } = input
  if (movementType === 'in' || movementType === 'adjust_in') {
    await payload.create({
      collection: 'stock-movements',
      data: {
        ...rest,
        movementType,
        unitCost: unitCost ?? 0,
      },
      depth: 0,
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: 'stock-movements',
    data: {
      ...rest,
      movementType,
    },
    depth: 0,
    overrideAccess: true,
  })
}

type ProductRef = { id: string; baseUnit: string; purchasePrice: number; minStockBase: number; maxStockBase: number }

async function loadSeedProducts(payload: Payload): Promise<ProductRef[]> {
  const result = await payload.find({
    collection: 'products',
    where: { code: { contains: 'SD-PRD' } },
    limit: TARGETS.products,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs.map((p) => ({
    id: String(p.id),
    baseUnit:
      typeof p.baseUnit === 'object' && p.baseUnit ? String(p.baseUnit.id) : String(p.baseUnit ?? ''),
    purchasePrice: Number(p.purchasePrice ?? 1),
    minStockBase: Number(p.minStockBase ?? 5),
    maxStockBase: Number(p.maxStockBase ?? 200),
  }))
}

async function loadRacks(payload: Payload): Promise<string[]> {
  const result = await payload.find({
    collection: 'racks',
    limit: TARGETS.racks,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.map((r) => String(r.id))
}

export async function seedInitialStock(ctx: SeedContext): Promise<void> {
  logPhase('Stock inicial (movimientos de entrada)')
  const { payload, rng } = ctx

  const existingStockMovements = await countDocs(payload, 'stock-movements', {
    notes: { contains: 'stock-inicial' },
  })

  const products = await loadSeedProducts(payload)
  if (existingStockMovements >= products.length && products.length > 0) {
    ctx.stats.stockLevels = await countDocs(payload, 'stock-levels')
    ctx.stats.stockLots = await countDocs(payload, 'stock-lots')
    logCount('Stock inicial (ya completo)', ctx.stats.stockLevels)
    return
  }

  const racks = await loadRacks(payload)
  if (!products.length || !racks.length) {
    console.log('  ⚠ Sin productos o racks para stock inicial')
    return
  }

  const mainRack = ctx.ids.mainRack ?? racks[0]
  let created = 0

  for (let i = existingStockMovements; i < products.length; i++) {
    const product = products[i]
    const rack = i % 3 === 0 ? mainRack : rng.pick(racks)
    const qty = rng.int(product.minStockBase + 10, product.maxStockBase)

    await payload.create({
      collection: 'stock-movements',
      data: {
        label: `Stock inicial ${padCode('PRD', i + 1, 5)}`,
        movementType: 'in',
        date: randomDateInLastMonths(rng, 11),
        product: product.id,
        rack,
        quantity: qty,
        unit: product.baseUnit,
        unitCost: product.purchasePrice,
        notes: seedNotes('stock-inicial'),
      },
      depth: 0,
      overrideAccess: true,
    })
    created++
    if (created % 100 === 0) console.log(`  … ${existingStockMovements + created}/${products.length} stocks`)
  }

  ctx.stats.stockLevels = await countDocs(payload, 'stock-levels')
  ctx.stats.stockLots = await countDocs(payload, 'stock-lots')
  logCount('Niveles de stock', ctx.stats.stockLevels)
  logCount('Lotes de stock', ctx.stats.stockLots)
}

export async function seedHistoricalMovements(ctx: SeedContext): Promise<void> {
  logPhase('Movimientos históricos')
  const { payload, rng } = ctx

  const existing = await countDocs(payload, 'stock-movements', {
    notes: { contains: 'historico' },
  })

  const target = TARGETS.historicalMovements
  if (existing >= target) {
    ctx.stats.movements = await countDocs(payload, 'stock-movements')
    ctx.stats.kardex = await countDocs(payload, 'kardex-entries')
    logCount('Movimientos históricos (ya completos)', existing)
    return
  }

  const products = await loadSeedProducts(payload)
  const racks = await loadRacks(payload)
  const types = ['in', 'out', 'adjust_in', 'adjust_out'] as const
  let created = 0

  for (let i = existing; i < target; i++) {
    const product = rng.pick(products)
    const rack = rng.pick(racks)
    let movementType = rng.pick(types)

    if (movementType === 'out' || movementType === 'adjust_out') {
      const level = await payload.find({
        collection: 'stock-levels',
        where: {
          and: [{ product: { equals: product.id } }, { rack: { equals: rack } }],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      const available = level.docs[0]
        ? Number(level.docs[0].quantityBase ?? 0)
        : 0
      if (available < 2) {
        movementType = 'in'
      }
    }

    const qty =
      movementType === 'adjust_in' || movementType === 'adjust_out'
        ? rng.int(1, 5)
        : rng.int(2, 20)

    const base = {
      label: `Movimiento histórico #${i + 1}`,
      date: randomDateInLastMonths(rng, 12),
      product: product.id,
      rack,
      quantity: qty,
      unit: product.baseUnit,
      notes: seedNotes('historico'),
    }

    try {
      await createStockMovement(payload, {
        ...base,
        movementType,
        unitCost:
          movementType === 'in' || movementType === 'adjust_in' ? product.purchasePrice : undefined,
      })
      created++
    } catch {
      await createStockMovement(payload, {
        ...base,
        movementType: 'in',
        unitCost: product.purchasePrice,
      })
      created++
    }

    if (created % 100 === 0) console.log(`  … ${existing + created}/${target} movimientos`)
  }

  ctx.stats.movements = await countDocs(payload, 'stock-movements')
  ctx.stats.kardex = await countDocs(payload, 'kardex-entries')
  logCount('Movimientos totales', ctx.stats.movements)
  logCount('Registros kardex', ctx.stats.kardex)
}

export async function seedPurchases(ctx: SeedContext): Promise<void> {
  logPhase('Órdenes de compra')
  const { payload, rng } = ctx
  const admin = ctx.ids.admin
  if (!admin) throw new Error('Usuario admin requerido para recepciones')

  const existing = await countDocs(payload, 'purchase-orders', {
    orderNumber: { contains: 'SD-OC' },
  })

  if (existing >= TARGETS.purchaseOrders) {
    ctx.stats.purchases = existing
    logCount('Órdenes de compra (ya completas)', existing)
    return
  }

  const products = await loadSeedProducts(payload)
  const racks = await loadRacks(payload)
  const suppliers = await payload.find({
    collection: 'suppliers',
    limit: TARGETS.suppliers,
    depth: 0,
    overrideAccess: true,
  })
  const supplierIds = suppliers.docs.map((s) => String(s.id))

  const statuses = ['draft', 'pending', 'partial', 'received', 'cancelled'] as const
  const req = createSeedReq(payload, admin)

  for (let i = existing; i < TARGETS.purchaseOrders; i++) {
    const status = statuses[i % statuses.length]
    const orderNumber = padCode('OC', i + 1, 5)
    const itemCount = rng.int(2, 6)
    const items = Array.from({ length: itemCount }, (_, j) => {
      const product = products[(i + j) % products.length]
      return {
        product: product.id,
        quantity: rng.int(10, 80),
        unitCost: product.purchasePrice,
        discount: rng.int(0, 1) === 0 ? rng.int(0, 20) : 0,
      }
    })

    const { id: orderId } = await upsertByField({
      payload,
      collection: 'purchase-orders',
      field: 'orderNumber',
      value: orderNumber,
      data: {
        orderNumber,
        supplier: rng.pick(supplierIds),
        status: status === 'partial' || status === 'received' ? 'pending' : status,
        orderDate: randomDateInLastMonths(rng, 10),
        currency: 'PEN',
        tax: 0,
        discount: 0,
        items,
        notes: seedNotes(`compra-${status}`),
        createdBy: admin.id,
      },
    })

    if (status === 'received' || status === 'partial') {
      const receiveItems = items.map((item) => ({
        product: item.product,
        quantity:
          status === 'received'
            ? item.quantity
            : Math.max(1, Math.floor(item.quantity * rng.float(0.3, 0.7))),
      }))

      try {
        await receivePurchaseOrder({
          req,
          user: admin,
          orderId,
          body: {
            rack: rng.pick(racks),
            notes: seedNotes('recepcion-compra'),
            items: receiveItems,
          },
        })
      } catch (err) {
        console.log(`  ⚠ Recepción omitida para ${orderNumber}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  ctx.stats.purchases = await countDocs(payload, 'purchase-orders')
  logCount('Órdenes de compra', ctx.stats.purchases)
}

export async function seedSales(ctx: SeedContext): Promise<void> {
  logPhase('Ventas')
  const { payload, rng } = ctx
  const admin = ctx.ids.admin

  const existing = await countDocs(payload, 'sales-orders', {
    orderNumber: { contains: 'SD-VT' },
  })

  if (existing >= TARGETS.salesOrders) {
    ctx.stats.sales = existing
    logCount('Ventas (ya completas)', existing)
    return
  }

  const products = await loadSeedProducts(payload)
  const racks = await loadRacks(payload)
  const customers = await payload.find({
    collection: 'customers',
    limit: TARGETS.customers,
    depth: 0,
    overrideAccess: true,
  })
  const customerIds = customers.docs.map((c) => String(c.id))
  const statuses = ['draft', 'confirmed', 'delivered', 'cancelled'] as const

  for (let i = existing; i < TARGETS.salesOrders; i++) {
    const status = statuses[i % statuses.length]
    const orderNumber = padCode('VT', i + 1, 5)
    const itemCount = rng.int(1, 8)
    const saleDate = randomDateInLastMonths(rng, 12)

    const items = Array.from({ length: itemCount }, (_, j) => {
      const product = products[(i * 3 + j) % products.length]
      const unitPrice = Math.round(product.purchasePrice * rng.float(1.2, 1.8) * 100) / 100
      return {
        product: product.id,
        quantity: rng.int(1, 12),
        unitPrice,
        discount: rng.int(0, 10) > 7 ? rng.int(5, 15) : 0,
      }
    })

    await upsertByField({
      payload,
      collection: 'sales-orders',
      field: 'orderNumber',
      value: orderNumber,
      data: {
        orderNumber,
        customer: rng.pick(customerIds),
        status,
        saleDate,
        items,
        tax: 0,
        discountAmount: 0,
        notes: seedNotes('venta'),
        createdBy: admin?.id,
      },
    })

    if (status === 'delivered') {
      for (const item of items) {
        const product = products.find((p) => p.id === item.product) ?? products[0]
        const rack = rng.pick(racks)
        try {
          await createStockMovement(payload, {
            label: `Salida venta ${orderNumber}`,
            movementType: 'out',
            date: saleDate,
            product: item.product,
            rack,
            quantity: Math.min(item.quantity, 5),
            unit: product.baseUnit,
            notes: seedNotes('venta-salida'),
            createdBy: admin?.id,
          })
        } catch {
          // Sin stock suficiente en ese rack
        }
      }
    }

    if ((i + 1) % 100 === 0) console.log(`  … ${i + 1}/${TARGETS.salesOrders} ventas`)
  }

  ctx.stats.sales = await countDocs(payload, 'sales-orders')
  ctx.stats.movements = await countDocs(payload, 'stock-movements')
  ctx.stats.kardex = await countDocs(payload, 'kardex-entries')
  logCount('Ventas', ctx.stats.sales)
}

export async function seedNotifications(ctx: SeedContext): Promise<void> {
  logPhase('Notificaciones')
  const { payload, rng } = ctx
  const { NOTIFICATION_SAMPLES } = await import('../lib/data')

  const recipients = Object.values(ctx.ids.users)
  const existing = await countDocs(payload, 'notifications', {
    title: { contains: 'Stock bajo' },
  })

  if (existing >= TARGETS.notifications) {
    ctx.stats.notifications = await countDocs(payload, 'notifications')
    logCount('Notificaciones (ya completas)', ctx.stats.notifications)
    return
  }

  for (let i = existing; i < TARGETS.notifications; i++) {
    const sample = NOTIFICATION_SAMPLES[i % NOTIFICATION_SAMPLES.length]
    await payload.create({
      collection: 'notifications',
      data: {
        recipient: rng.pick(recipients).id,
        title: sample.title,
        message: `${sample.message} (demo #${i + 1})`,
        type: sample.type,
        priority: sample.priority,
        isRead: rng.int(0, 10) > 6,
        entityType: 'seed',
        entityId: String(i + 1),
        createdBy: ctx.ids.admin?.id,
      },
      overrideAccess: true,
    })
  }

  ctx.stats.notifications = await countDocs(payload, 'notifications')
  logCount('Notificaciones', ctx.stats.notifications)
}

export async function seedAuditLogs(ctx: SeedContext): Promise<void> {
  logPhase('Auditoría')
  const { payload, rng } = ctx

  const existing = await countDocs(payload, 'audit-logs', {
    action: { contains: 'seed.' },
  })

  const actions = [
    { action: 'seed.product.create', module: 'products' },
    { action: 'seed.purchase.create', module: 'purchases' },
    { action: 'seed.sale.create', module: 'sales' },
    { action: 'seed.stock.adjust', module: 'inventory' },
    { action: 'seed.user.login', module: 'auth' },
    { action: 'seed.settings.update', module: 'settings' },
  ]

  if (existing >= TARGETS.auditLogs) {
    ctx.stats.auditLogs = await countDocs(payload, 'audit-logs')
    logCount('Auditoría (ya completa)', ctx.stats.auditLogs)
    return
  }

  for (let i = existing; i < TARGETS.auditLogs; i++) {
    const sample = rng.pick(actions)
    await writeAuditLogWithPayload({
      payload,
      user: ctx.ids.admin,
      action: sample.action,
      module: sample.module,
      resourceId: padCode('AUD', i + 1, 4),
      details: { seed: true, index: i + 1, timestamp: new Date().toISOString() },
      ip: '127.0.0.1',
      userAgent: 'seed-script/1.0',
    })
  }

  ctx.stats.auditLogs = await countDocs(payload, 'audit-logs')
  logCount('Registros de auditoría', ctx.stats.auditLogs)
}
