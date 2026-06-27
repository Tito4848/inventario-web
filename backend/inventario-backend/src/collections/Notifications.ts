import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess } from '@/access/roles'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipient', 'type', 'isRead', 'createdAt'],
  },
  access: {
    read: inventoryReadAccess,
    create: adminOnly,
    update: inventoryReadAccess,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'Destinatario',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Título',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: 'Mensaje',
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Información', value: 'info' },
        { label: 'Advertencia', value: 'warning' },
        { label: 'Éxito', value: 'success' },
        { label: 'Error', value: 'error' },
      ],
      index: true,
      label: 'Tipo',
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Baja', value: 'low' },
        { label: 'Media', value: 'medium' },
        { label: 'Alta', value: 'high' },
      ],
      index: true,
      label: 'Prioridad',
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
      label: 'Leída',
      index: true,
    },
    {
      name: 'entityType',
      type: 'text',
      label: 'Tipo entidad',
    },
    {
      name: 'entityId',
      type: 'text',
      label: 'ID entidad',
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadatos',
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Vence',
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
        if (!data) return data
        if (operation === 'create' && !data.createdBy && req.user?.id) data.createdBy = req.user.id
        return data
      },
    ],
  },
  timestamps: true,
}
