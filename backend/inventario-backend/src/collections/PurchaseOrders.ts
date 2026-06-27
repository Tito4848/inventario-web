import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

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
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: true,
      label: 'Proveedor',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Enviada', value: 'sent' },
        { label: 'Recibida parcial', value: 'partial' },
        { label: 'Recibida', value: 'received' },
        { label: 'Facturada', value: 'invoiced' },
        { label: 'Cancelada', value: 'cancelled' },
      ],
      index: true,
    },
    {
      name: 'orderDate',
      type: 'date',
      required: true,
      label: 'Fecha orden',
    },
    {
      name: 'receivedDate',
      type: 'date',
      label: 'Fecha recepción',
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
        { name: 'quantity', type: 'number', required: true, min: 0 },
        { name: 'unitCost', type: 'number', required: true, min: 0 },
        { name: 'total', type: 'number', admin: { readOnly: true } },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      defaultValue: 0,
      label: 'Subtotal',
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
      label: 'Notas',
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
          data.subtotal = data.items.reduce(
            (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
            0,
          )
          data.items = data.items.map((item) => ({
            ...item,
            total: (item.quantity || 0) * (item.unitCost || 0),
          }))
        }
        data.total = (data.subtotal || 0) + (data.tax || 0)
        return data
      },
    ],
  },
  timestamps: true,
}
