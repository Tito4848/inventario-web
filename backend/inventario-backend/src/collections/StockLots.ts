import type { CollectionConfig } from 'payload'

import { inventoryReadAccess } from '@/access/roles'

export const StockLots: CollectionConfig = {
  slug: 'stock-lots',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'product', 'rack', 'receivedAt', 'qtyRemainingBase', 'unitCostBase'],
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
      admin: { readOnly: true },
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
      name: 'receivedAt',
      type: 'date',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'initialQtyBase',
      type: 'number',
      required: true,
      admin: { readOnly: true },
      label: 'Cantidad inicial (base)',
    },
    {
      name: 'qtyRemainingBase',
      type: 'number',
      required: true,
      index: true,
      admin: { readOnly: true },
      label: 'Saldo (base)',
    },
    {
      name: 'unitCostBase',
      type: 'number',
      required: true,
      admin: { readOnly: true },
      label: 'Costo unitario (base)',
    },
    {
      name: 'sourceMovement',
      type: 'relationship',
      relationTo: 'stock-movements',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}

