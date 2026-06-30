import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'
import { allocateFIFO } from '@/lib/inventory/fifo'
import { upsertStockLevel } from '@/lib/inventory/stockLevels'
import { convertQuantity, getConversionFactor } from '@/lib/inventory/units'
import { createKardexEntry } from '@/lib/inventory/kardex'

const MOVEMENT_TYPES = ['in', 'out', 'adjust_in', 'adjust_out'] as const
type MovementType = (typeof MOVEMENT_TYPES)[number]

function requiresUnitCost(type: MovementType): boolean {
  return type === 'in' || type === 'adjust_in'
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export const StockMovements: CollectionConfig = {
  slug: 'stock-movements',
  admin: {
    useAsTitle: 'label',
    defaultColumns: [
      'label',
      'movementType',
      'date',
      'product',
      'rack',
      'quantity',
      'unit',
      'quantityBase',
      'totalValue',
    ],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Descripción',
    },
    {
      name: 'movementType',
      type: 'select',
      required: true,
      options: [
        { label: 'Entrada', value: 'in' },
        { label: 'Salida', value: 'out' },
        { label: 'Ajuste (+)', value: 'adjust_in' },
        { label: 'Ajuste (-)', value: 'adjust_out' },
      ],
      index: true,
      label: 'Tipo',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      label: 'Fecha',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
      label: 'Producto',
    },
    {
      name: 'rack',
      type: 'relationship',
      relationTo: 'racks',
      required: true,
      index: true,
      label: 'Rack',
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 0.0000001,
      label: 'Cantidad',
    },
    {
      name: 'unit',
      type: 'relationship',
      relationTo: 'units',
      required: true,
      index: true,
      label: 'Unidad',
    },
    {
      name: 'unitCost',
      type: 'number',
      min: 0,
      label: 'Costo unitario (en la unidad ingresada)',
      admin: {
        condition: (_, siblingData) => {
          const t = siblingData?.movementType as MovementType | undefined
          return t ? requiresUnitCost(t) : false
        },
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Registrado por',
      admin: { readOnly: true },
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notas',
    },
    {
      name: 'quantityBase',
      type: 'number',
      label: 'Cantidad (unidad base)',
      admin: { readOnly: true },
      index: true,
    },
    {
      name: 'unitCostBase',
      type: 'number',
      label: 'Costo unitario (unidad base)',
      admin: { readOnly: true },
    },
    {
      name: 'totalValue',
      type: 'number',
      label: 'Valor total',
      admin: { readOnly: true },
      index: true,
    },
    {
      name: 'fifoAllocations',
      type: 'array',
      label: 'FIFO (detalle)',
      admin: { readOnly: true, condition: (_, siblingData) => siblingData?.movementType === 'out' || siblingData?.movementType === 'adjust_out' },
      fields: [
        {
          name: 'lot',
          type: 'relationship',
          relationTo: 'stock-lots',
          required: true,
        },
        {
          name: 'qtyBase',
          type: 'number',
          required: true,
        },
        {
          name: 'unitCostBase',
          type: 'number',
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        if (!data) return data

        if (!data.createdBy && req.user?.id) {
          data.createdBy = req.user.id
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        if (!data) return data

        const movementType = data.movementType as MovementType | undefined
        if (!movementType || !MOVEMENT_TYPES.includes(movementType)) {
          throw new Error('Tipo de movimiento inválido.')
        }

        const productId = String(data.product)
        const unitId = String(data.unit)
        const rackId = String(data.rack)
        const qty = Number(data.quantity)
        if (!Number.isFinite(qty) || qty <= 0) throw new Error('Cantidad inválida.')

        const product = await req.payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
          req,
        })
        const pr = asRecord(product)
        const baseUnitId = String(pr?.baseUnit ?? '')
        if (!baseUnitId) throw new Error('El producto no tiene unidad base configurada.')

        const qtyBase = await convertQuantity({
          req,
          quantity: qty,
          fromUnit: unitId,
          toUnit: baseUnitId,
        })
        data.quantityBase = qtyBase

        if (requiresUnitCost(movementType)) {
          const unitCost = Number(data.unitCost)
          if (!Number.isFinite(unitCost) || unitCost < 0) throw new Error('Costo unitario inválido.')

          const factorToBase = await getConversionFactor({ req, fromUnit: unitId, toUnit: baseUnitId })
          const unitCostBase = factorToBase === 0 ? 0 : unitCost / factorToBase
          data.unitCostBase = unitCostBase
          data.totalValue = qtyBase * unitCostBase
        } else {
          data.unitCostBase = 0
          data.totalValue = 0
        }

        if (movementType === 'out' || movementType === 'adjust_out') {
          const allowNegative = Boolean(pr?.allowNegativeStock)
          if (!allowNegative) {
            const level = await req.payload.find({
              collection: 'stock-levels',
              where: { and: [{ product: { equals: productId } }, { rack: { equals: rackId } }] },
              depth: 0,
              limit: 1,
              req,
            })
            const first = level.docs[0] as unknown
            const lr = asRecord(first)
            const available = level.docs.length ? Number(lr?.quantityBase ?? 0) : 0
            if (available < qtyBase) {
              throw new Error('Stock insuficiente para registrar la salida.')
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, context }) => {
        if (operation !== 'create') return doc
        if (context?.inventoryProcessed) return doc

        const dr = asRecord(doc)
        const movementType = String(dr?.movementType) as MovementType
        const productId = String(dr?.product ?? '')
        const rackId = String(dr?.rack ?? '')
        const qtyBase = Number(dr?.quantityBase ?? 0)
        const date = String(dr?.date ?? '')
        const receivedAt = date ? new Date(date).toISOString() : new Date().toISOString()

        if (movementType === 'in' || movementType === 'adjust_in') {
          const unitCostBase = Number(dr?.unitCostBase ?? 0)
          const totalValue = Number(dr?.totalValue ?? 0)

          await req.payload.create({
            collection: 'stock-lots',
            data: {
              label: `LOT ${productId} ${receivedAt}`,
              product: productId,
              rack: rackId,
              receivedAt,
              initialQtyBase: qtyBase,
              qtyRemainingBase: qtyBase,
              unitCostBase,
              sourceMovement: String(dr?.id ?? ''),
            },
            depth: 0,
            req,
          })

          await upsertStockLevel({
            req,
            product: productId,
            rack: rackId,
            deltaQtyBase: qtyBase,
            deltaValue: totalValue,
          })

          await createKardexEntry({
            req,
            product: productId,
            rack: rackId,
            movementId: String(dr?.id ?? ''),
            lotId: undefined,
            entryType: 'in',
            quantityBase: qtyBase,
            unitCostBase,
            value: totalValue,
            balanceQtyBase: qtyBase,
            balanceValue: totalValue,
            occurredAt: receivedAt,
          })

          return doc
        }

        if (movementType === 'out' || movementType === 'adjust_out') {
          const { allocations, totalValue } = await allocateFIFO({
            req,
            product: productId,
            rack: rackId,
            qtyOutBase: qtyBase,
          })

          const unitCostBase = qtyBase === 0 ? 0 : totalValue / qtyBase

          await req.payload.update({
            collection: 'stock-movements',
            id: String(dr?.id ?? ''),
            data: {
              unitCostBase,
              totalValue,
              fifoAllocations: allocations.map((a) => ({
                lot: a.lot,
                qtyBase: a.qtyBase,
                unitCostBase: a.unitCostBase,
                value: a.value,
              })),
            },
            depth: 0,
            context: { ...(context || {}), inventoryProcessed: true },
            req,
          })

          await upsertStockLevel({
            req,
            product: productId,
            rack: rackId,
            deltaQtyBase: -qtyBase,
            deltaValue: -totalValue,
          })

          await createKardexEntry({
            req,
            product: productId,
            rack: rackId,
            movementId: String(dr?.id ?? ''),
            lotId: undefined,
            entryType: 'out',
            quantityBase: qtyBase,
            unitCostBase: qtyBase === 0 ? 0 : totalValue / qtyBase,
            value: totalValue,
            balanceQtyBase: -qtyBase,
            balanceValue: -totalValue,
            occurredAt: receivedAt,
          })

          return doc
        }

        return doc
      },
    ],
  },
  timestamps: true,
}

