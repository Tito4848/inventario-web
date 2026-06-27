import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Racks: CollectionConfig = {
  slug: 'racks',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'section', 'active', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'sections',
      required: true,
      index: true,
      label: 'Sección',
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
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notas',
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

