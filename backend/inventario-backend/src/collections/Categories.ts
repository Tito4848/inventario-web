import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'parent', 'updatedAt'],
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría padre',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
  ],
  timestamps: true,
}

