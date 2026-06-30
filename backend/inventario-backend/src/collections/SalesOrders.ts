import type { CollectionConfig } from 'payload'

import {
  adminOnly,
  salesOrdersReadAccess,
  salesOrdersWriteAccess,
} from '@/access/roles'
import { generateSaleOrderNumber } from '@/lib/sales/orderNumber'
import {
  computeLineTotal,
  computeSaleTotals,
  normalizeSaleStatus,
} from '@/lib/sales/validation'

export const SalesOrders: CollectionConfig = {
  slug: 'sales-orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'status', 'total', 'saleDate', 'updatedAt'],
  },
  access: {
    read: salesOrdersReadAccess,
    create: salesOrdersWriteAccess,
    update: salesOrdersWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'N° Venta',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Cliente',
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
        { label: 'Confirmada', value: 'confirmed' },
        { label: 'Entregada', value: 'delivered' },
        { label: 'Cancelada', value: 'cancelled' },
        { label: 'Devuelta', value: 'returned' },
      ],
      index: true,
    },
    {
      name: 'saleDate',
      type: 'date',
      required: true,
      label: 'Fecha venta',
      index: true,
    },
    {
      name: 'confirmedAt',
      type: 'date',
      label: 'Fecha confirmación',
    },
    {
      name: 'deliveredAt',
      type: 'date',
      label: 'Fecha entrega',
    },
    {
      name: 'returnedAt',
      type: 'date',
      label: 'Fecha devolución',
    },
    {
      name: 'rack',
      type: 'relationship',
      relationTo: 'racks',
      label: 'Rack de despacho',
      index: true,
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 0 },
        { name: 'unitPrice', type: 'number', required: true, min: 0 },
        { name: 'discount', type: 'number', defaultValue: 0, min: 0, max: 100 },
        { name: 'total', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'deliveries',
      type: 'array',
      label: 'Entregas',
      admin: { readOnly: true },
      fields: [
        { name: 'date', type: 'date', required: true },
        {
          name: 'deliveredBy',
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
        {
          name: 'movementIds',
          type: 'array',
          fields: [{ name: 'movementId', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'discountAmount',
      type: 'number',
      defaultValue: 0,
      label: 'Descuento total',
    },
    {
      name: 'tax',
      type: 'number',
      defaultValue: 0,
      label: 'Impuesto',
    },
    {
      name: 'total',
      type: 'number',
      defaultValue: 0,
      label: 'Total',
    },
    {
      name: 'notes',
      type: 'textarea',
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
            data.orderNumber = await generateSaleOrderNumber(req)
          }
        }

        if (Array.isArray(data.items)) {
          const normalizedItems = data.items.map((item) => {
            const quantity = Number(item.quantity ?? 0)
            const unitPrice = Number(item.unitPrice ?? 0)
            const discount = Number(item.discount ?? 0)
            if (quantity < 0) throw new Error('Cantidad negativa no permitida.')
            if (unitPrice < 0) throw new Error('Precio negativo no permitido.')
            if (discount < 0) throw new Error('Descuento negativo no permitido.')
            return {
              ...item,
              quantity,
              unitPrice,
              discount,
              total: computeLineTotal({ product: String(item.product ?? ''), quantity, unitPrice, discount }),
            }
          })
          data.items = normalizedItems

          const discountAmount = Number(data.discountAmount ?? 0)
          const tax = Number(data.tax ?? 0)
          const { subtotal, total } = computeSaleTotals(
            normalizedItems.map((i) => ({
              product: String(i.product ?? ''),
              quantity: Number(i.quantity ?? 0),
              unitPrice: Number(i.unitPrice ?? 0),
              discount: Number(i.discount ?? 0),
            })),
            discountAmount,
            tax,
          )
          data.subtotal = subtotal
          data.total = total
        }

        if (data.status) {
          data.status = normalizeSaleStatus(String(data.status))
        }

        return data
      },
    ],
  },
  timestamps: true,
}
