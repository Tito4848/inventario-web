import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'taxId', 'email', 'phone', 'active', 'updatedAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: inventoryWriteAccess,
    update: inventoryWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'businessName',
      type: 'text',
      required: true,
      label: 'Razón social',
      index: true,
    },
    {
      name: 'taxId',
      type: 'text',
      required: true,
      unique: true,
      label: 'RUC',
      index: true,
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Dirección',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Teléfono',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Correo',
    },
    {
      name: 'contactName',
      type: 'text',
      label: 'Contacto',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Registrado por',
      admin: { readOnly: true },
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
