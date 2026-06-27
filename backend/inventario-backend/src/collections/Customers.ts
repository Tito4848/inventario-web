import type { CollectionConfig } from 'payload'

import { adminOnly, customersReadAccess, customersWriteAccess } from '@/access/roles'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'taxId', 'email', 'phone', 'active', 'updatedAt'],
  },
  access: {
    read: customersReadAccess,
    create: customersWriteAccess,
    update: customersWriteAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'linkedUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Usuario vinculado',
      admin: { position: 'sidebar' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre / Razón social',
      index: true,
    },
    {
      name: 'taxId',
      type: 'text',
      label: 'RUC / DNI',
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
