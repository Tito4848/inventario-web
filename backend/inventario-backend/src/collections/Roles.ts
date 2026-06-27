import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess } from '@/access/roles'

export const Roles: CollectionConfig = {
  slug: 'roles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'isActive', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: adminOnly,
    update: adminOnly,
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
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'permissions',
      type: 'json',
      label: 'Permisos',
      defaultValue: {},
    },
    {
      name: 'isActive',
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
        if (operation !== 'create' || !data) return data
        if (!data.createdBy && req.user?.id) data.createdBy = req.user.id
        return data
      },
    ],
  },
  timestamps: true,
}
