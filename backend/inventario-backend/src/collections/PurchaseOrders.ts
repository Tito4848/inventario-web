import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'
import { generatePurchaseOrderNumber } from '@/lib/purchases/orderNumber'
import {
  computeLineSubtotal,
  computePurchaseTotals,
  normalizePurchaseStatus,
} from '@/lib/purchases/validation'

export const PurchaseOrders: CollectionConfig = {
  slug: 'purchase-orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'supplier', 'status', 'total', 'orderDate', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'N° Orden',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      label: 'Proveedor',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Pendiente', value: 'pending' },
        { label: 'Pendiente (legacy)', value: 'sent' },
        { label: 'Recibida parcial', value: 'partial' },
        { label: 'Recibida', value: 'received' },
        { label: 'Facturada (legacy)', value: 'invoiced' },
        { label: 'Cancelada', value: 'cancelled' },
      ],
      index: true,
    },
    {
      name: 'orderDate',
      type: 'date',
      required: true,
      label: 'Fecha orden',
      index: true,
    },
    {
      name: 'receivedDate',
      type: 'date',
      label: 'Fecha recepción',
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'PEN',
      options: [
        { label: 'Soles (PEN)', value: 'PEN' },
        { label: 'Dólares (USD)', value: 'USD' },
      ],
      label: 'Moneda',
    },
    {
      name: 'rack',
      type: 'relationship',
      relationTo: 'racks',
      label: 'Rack por defecto',
    },
    {
      name: 'invoiceNumber',
      type: 'text',
      label: 'N° Factura',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 0.0000001 },
        { name: 'unitCost', type: 'number', required: true, min: 0 },
        { name: 'discount', type: 'number', defaultValue: 0, min: 0, label: 'Descuento línea' },
        { name: 'quantityReceived', type: 'number', defaultValue: 0, min: 0, label: 'Cant. recibida' },
        { name: 'total', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'receptions',
      type: 'array',
      label: 'Recepciones',
      admin: { readOnly: true },
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'receivedBy',
          type: 'relationship',
          relationTo: 'users',
          label: 'Usuario',
        },
        { name: 'notes', type: 'textarea', label: 'Observación' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products', required: true },
            { name: 'quantity', type: 'number', required: true, min: 0.0000001 },
          ],
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      defaultValue: 0,
      label: 'Subtotal',
      admin: { readOnly: true },
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Descuento',
    },
    {
      name: 'tax',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Impuestos',
    },
    {
      name: 'total',
      type: 'number',
      defaultValue: 0,
      label: 'Total',
      admin: { readOnly: true },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Observaciones',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data

        if (operation === 'create') {
          if (!data.createdBy && req.user?.id) data.createdBy = req.user.id
          if (!data.orderNumber) {
            data.orderNumber = await generatePurchaseOrderNumber(req)
          }
        }

        if (Array.isArray(data.items)) {
          const normalizedItems = data.items.map((item) => {
            const quantity = Number(item.quantity ?? 0)
            const unitCost = Number(item.unitCost ?? 0)
            const discount = Number(item.discount ?? 0)
            if (quantity < 0) throw new Error('Cantidad negativa no permitida.')
            if (unitCost < 0) throw new Error('Precio negativo no permitido.')
            if (discount < 0) throw new Error('Descuento negativo no permitido.')
            const lineTotal = computeLineSubtotal({
              product: String(item.product ?? ''),
              quantity,
              unitCost,
              discount,
            })
            return {
              ...item,
              quantity,
              unitCost,
              discount,
              quantityReceived: Number(item.quantityReceived ?? 0),
              total: lineTotal,
            }
          })
          data.items = normalizedItems

          const orderDiscount = Number(data.discount ?? 0)
          const tax = Number(data.tax ?? 0)
          const { subtotal, total } = computePurchaseTotals(
            normalizedItems.map((i) => ({
              product: String(i.product ?? ''),
              quantity: Number(i.quantity ?? 0),
              unitCost: Number(i.unitCost ?? 0),
              discount: Number(i.discount ?? 0),
            })),
            orderDiscount,
            tax,
          )
          data.subtotal = subtotal
          data.total = total
        }

        if (data.status) {
          data.status = normalizePurchaseStatus(String(data.status))
        }

        return data
      },
    ],
  },
  timestamps: true,
}
