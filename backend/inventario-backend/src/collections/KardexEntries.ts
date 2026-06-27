import type { CollectionConfig } from 'payload'

import { inventoryReadAccess } from '@/access/roles'

export const KardexEntries: CollectionConfig = {
  slug: 'kardex-entries',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['product', 'movement', 'entryType', 'quantityBase', 'balanceQtyBase', 'occurredAt'],
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
      label: 'Etiqueta',
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
      name: 'movement',
      type: 'relationship',
      relationTo: 'stock-movements',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'lot',
      type: 'relationship',
      relationTo: 'stock-lots',
      label: 'Lote',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'entryType',
      type: 'select',
      required: true,
      options: [
        { label: 'Entrada', value: 'in' },
        { label: 'Salida', value: 'out' },
      ],
      index: true,
      label: 'Tipo',
    },
    {
      name: 'quantityBase',
      type: 'number',
      required: true,
      min: 0.0000001,
      label: 'Cantidad base',
    },
    {
      name: 'unitCostBase',
      type: 'number',
      min: 0,
      label: 'Costo unitario base',
    },
    {
      name: 'value',
      type: 'number',
      min: 0,
      label: 'Valor',
    },
    {
      name: 'balanceQtyBase',
      type: 'number',
      required: true,
      label: 'Saldo base',
    },
    {
      name: 'balanceValue',
      type: 'number',
      required: true,
      label: 'Saldo valor',
    },
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      index: true,
      label: 'Fecha',
    },
  ],
  timestamps: true,
}
