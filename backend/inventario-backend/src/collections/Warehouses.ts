import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Warehouses: CollectionConfig = {
  slug: 'warehouses',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'active', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Código',
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      index: true,
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Dirección',
    },
  ],
  timestamps: true,
}

