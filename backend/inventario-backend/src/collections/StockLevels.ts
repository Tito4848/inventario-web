import type { CollectionConfig } from 'payload'

import { inventoryReadAccess } from '@/access/roles'

export const StockLevels: CollectionConfig = {
  slug: 'stock-levels',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'product', 'rack', 'quantityBase', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'rack',
      type: 'relationship',
      relationTo: 'racks',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'quantityBase',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      admin: { readOnly: true },
      label: 'Valor (aprox.)',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Registrado por',
      admin: { readOnly: true },
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        if (!data) return data
        if (!data.createdBy && req.user?.id) data.createdBy = req.user.id
        return data
      },
    ],
  },
  timestamps: true,
}

