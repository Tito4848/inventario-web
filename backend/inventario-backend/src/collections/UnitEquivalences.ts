import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const UnitEquivalences: CollectionConfig = {
  slug: 'unit-equivalences',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'fromUnit', 'toUnit', 'factor', 'active'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Etiqueta',
      admin: {
        description: 'Ej: 1 Caja = 12 Unidades',
      },
    },
    {
      name: 'fromUnit',
      type: 'relationship',
      relationTo: 'units',
      required: true,
      index: true,
      label: 'Unidad origen',
    },
    {
      name: 'toUnit',
      type: 'relationship',
      relationTo: 'units',
      required: true,
      index: true,
      label: 'Unidad destino',
    },
    {
      name: 'factor',
      type: 'number',
      required: true,
      min: 0.0000001,
      label: 'Factor',
      admin: {
        description: 'Cantidad de "unidad destino" que equivale a 1 "unidad origen".',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      index: true,
    },
  ],
  timestamps: true,
}

