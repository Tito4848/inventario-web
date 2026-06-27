import type { CollectionConfig } from 'payload'

import { adminOnly, auditReadAccess } from '@/access/roles'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['user', 'action', 'module', 'ip', 'createdAt'],
  },
  access: {
    read: auditReadAccess,
    create: adminOnly,
    update: () => false,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Usuario',
      index: true,
    },
    {
      name: 'action',
      type: 'text',
      required: true,
      label: 'Acción',
      index: true,
    },
    {
      name: 'module',
      type: 'text',
      required: true,
      label: 'Módulo',
      index: true,
    },
    {
      name: 'resourceId',
      type: 'text',
      label: 'ID recurso',
    },
    {
      name: 'details',
      type: 'json',
      label: 'Detalles',
    },
    {
      name: 'ip',
      type: 'text',
      label: 'IP',
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'Navegador',
    },
  ],
  timestamps: true,
}
