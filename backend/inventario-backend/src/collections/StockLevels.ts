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
  ],
  timestamps: true,
}

