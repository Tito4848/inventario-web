import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Sections: CollectionConfig = {
  slug: 'sections',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'warehouse', 'active', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'warehouse',
      type: 'relationship',
      relationTo: 'warehouses',
      required: true,
      index: true,
      label: 'Almacén',
    },
    {
      name: 'code',
      type: 'text',
      required: true,
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
  ],
  timestamps: true,
}

