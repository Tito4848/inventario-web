import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Returns: CollectionConfig = {
  slug: 'returns',
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['reason', 'type', 'status', 'total', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Compra', value: 'purchase' },
        { label: 'Venta', value: 'sale' },
      ],
      index: true,
      label: 'Tipo',
    },
    {
      name: 'referenceType',
      type: 'select',
      required: true,
      options: [
        { label: 'Orden de compra', value: 'purchase-order' },
        { label: 'Orden de venta', value: 'sales-order' },
      ],
      index: true,
      label: 'Referencia',
    },
    {
      name: 'referenceId',
      type: 'text',
      required: true,
      label: 'ID referencia',
      index: true,
    },
    {
      name: 'reason',
      type: 'text',
      required: true,
      label: 'Motivo',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'requested',
      options: [
        { label: 'Solicitada', value: 'requested' },
        { label: 'Aprobada', value: 'approved' },
        { label: 'Rechazada', value: 'rejected' },
        { label: 'Procesada', value: 'processed' },
      ],
      index: true,
      label: 'Estado',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 0.0000001 },
        { name: 'unit', type: 'relationship', relationTo: 'units', required: true },
        { name: 'unitCost', type: 'number', min: 0 },
        { name: 'unitPrice', type: 'number', min: 0 },
        { name: 'lineTotal', type: 'number', required: true, min: 0 },
      ],
    },
    {
      name: 'total',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Total',
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
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Aprobado por',
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create' && !data.createdBy && req.user?.id) data.createdBy = req.user.id
        if (Array.isArray(data.items)) {
          data.total = data.items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0)
        }
        return data
      },
    ],
  },
  timestamps: true,
}
