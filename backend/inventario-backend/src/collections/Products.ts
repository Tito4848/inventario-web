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
      label: 'Código / SKU',
    },
    {
      name: 'barcode',
      type: 'text',
      label: 'Código de barras',
      index: true,
    },
    {
      name: 'qrCode',
      type: 'text',
      label: 'Código QR',
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
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      label: 'Subcategoría',
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
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      label: 'Proveedor',
    },
    {
      name: 'purchasePrice',
      type: 'number',
      min: 0,
      label: 'Precio compra',
    },
    {
      name: 'salePrice',
      type: 'number',
      min: 0,
      label: 'Precio venta',
    },
    {
      name: 'taxRate',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 18,
      label: 'Impuesto (%)',
    },
    {
      name: 'minStockBase',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Stock mínimo (en unidad base)',
    },
    {
      name: 'trackInventory',
      type: 'checkbox',
      defaultValue: true,
      label: 'Controlar inventario',
    },
    {
      name: 'allowNegativeStock',
      type: 'checkbox',
      defaultValue: false,
      label: 'Permitir stock negativo',
    },
    {
      name: 'maxStockBase',
      type: 'number',
      min: 0,
      label: 'Stock máximo (en unidad base)',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'Descontinuado', value: 'discontinued' },
      ],
      index: true,
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

        if (operation === 'create' && !data.createdBy && req.user?.id) {
          data.createdBy = req.user.id
        }

        if (!data.code) {
          throw new Error('El código del producto es obligatorio.')
        }

        if (!data.name) {
          throw new Error('El nombre del producto es obligatorio.')
        }

        return data
      },
    ],
  },
  timestamps: true,
}

