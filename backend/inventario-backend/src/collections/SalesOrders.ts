import type { CollectionConfig } from 'payload'

import {
  adminOnly,
  auditReadAccess,
  customersReadAccess,
  customersWriteAccess,
  salesOrdersReadAccess,
  salesOrdersWriteAccess,
  usersReadAccess,
} from '@/access/roles'

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
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Cliente',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Confirmada', value: 'confirmed' },
        { label: 'Entregada', value: 'delivered' },
        { label: 'Cancelada', value: 'cancelled' },
      ],
      index: true,
    },
    {
      name: 'saleDate',
      type: 'date',
      required: true,
      label: 'Fecha venta',
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
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create' && !data.createdBy && req.user?.id) {
          data.createdBy = req.user.id
        }
        if (Array.isArray(data.items)) {
          data.subtotal = data.items.reduce((sum, item) => {
            const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
            const discount = lineTotal * ((item.discount || 0) / 100)
            return sum + (lineTotal - discount)
          }, 0)
          data.items = data.items.map((item) => {
            const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
            const discount = lineTotal * ((item.discount || 0) / 100)
            return { ...item, total: lineTotal - discount }
          })
        }
        data.total = (data.subtotal || 0) - (data.discountAmount || 0) + (data.tax || 0)
        return data
      },
    ],
  },
  timestamps: true,
}
