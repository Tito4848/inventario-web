import type { CollectionConfig } from 'payload'

import { adminOnly, inventoryReadAccess, inventoryWriteAccess } from '@/access/roles'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'category', 'baseUnit', 'minStockBase', 'active', 'updatedAt'],
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
      index: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría',
      index: true,
    },
    {
      name: 'baseUnit',
      type: 'relationship',
      relationTo: 'units',
      required: true,
      label: 'Unidad base',
      index: true,
    },
    {
      name: 'minStockBase',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Stock mínimo (en unidad base)',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activo',
      index: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
  ],
  timestamps: true,
}

