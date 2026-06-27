import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess } from '@/access/roles'

export const Settings: CollectionConfig = {
  slug: 'settings',
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'scope', 'scopeId', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      index: true,
      label: 'Clave',
    },
    {
      name: 'value',
      type: 'json',
      required: true,
      label: 'Valor',
      defaultValue: {},
    },
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'global',
      options: [
        { label: 'Global', value: 'global' },
        { label: 'Almacén', value: 'warehouse' },
        { label: 'Rol', value: 'role' },
        { label: 'Usuario', value: 'user' },
      ],
      index: true,
      label: 'Alcance',
    },
    {
      name: 'scopeId',
      type: 'text',
      label: 'ID alcance',
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'updatedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Actualizado por',
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data
        if (operation === 'create' && !data.updatedBy && req.user?.id) data.updatedBy = req.user.id
        return data
      },
    ],
  },
  timestamps: true,
}
