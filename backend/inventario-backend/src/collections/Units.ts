import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Units: CollectionConfig = {
  slug: 'units',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'abbreviation', 'active', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Nombre',
    },
    {
      name: 'abbreviation',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Abreviatura',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      index: true,
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

