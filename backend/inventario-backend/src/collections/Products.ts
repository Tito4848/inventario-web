import type { CollectionConfig } from 'payload'

import {
  canCreateProducts,
  canDeleteProducts,
  canViewProductsModule,
} from '@/access/productsAccess'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'code',
      'name',
      'category',
      'brand',
      'baseUnit',
      'minStockBase',
      'active',
      'updatedAt',
    ],
  },
  access: {
    read: ({ req }) => canViewProductsModule(req.user),
    create: ({ req }) => canCreateProducts(req.user),
    update: ({ req }) => canCreateProducts(req.user),
    delete: ({ req }) => canDeleteProducts(req.user),
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
      unique: true,
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
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Categoría',
      index: true,
    },
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      label: 'Subcategoría',
      index: true,
      filterOptions: ({ data }) => {
        if (!data?.category) return true
        const categoryId =
          typeof data.category === 'object' ? data.category.id : data.category
        return { category: { equals: categoryId } }
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      label: 'Marca',
      index: true,
    },
    {
      name: 'baseUnit',
      type: 'relationship',
      relationTo: 'units',
      required: true,
      label: 'Unidad de medida',
      index: true,
    },
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      label: 'Proveedor',
      index: true,
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
      name: 'weight',
      type: 'number',
      min: 0,
      label: 'Peso (kg)',
      admin: {
        description: 'Opcional. Peso en kilogramos.',
      },
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
      label: 'Imagen principal',
      admin: { description: 'Compatibilidad con registros anteriores.' },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Imágenes',
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
      async ({ data, req, operation, originalDoc }) => {
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

        if (!data.category) {
          throw new Error('La categoría es obligatoria.')
        }

        if (!data.baseUnit) {
          throw new Error('La unidad de medida es obligatoria.')
        }

        const purchasePrice = data.purchasePrice != null ? Number(data.purchasePrice) : 0
        const salePrice = data.salePrice != null ? Number(data.salePrice) : 0
        const minStock = data.minStockBase != null ? Number(data.minStockBase) : 0

        if (purchasePrice < 0) {
          throw new Error('El precio de compra debe ser mayor o igual a cero.')
        }
        if (salePrice < 0) {
          throw new Error('El precio de venta debe ser mayor o igual a cero.')
        }
        if (minStock < 0) {
          throw new Error('El stock mínimo debe ser mayor o igual a cero.')
        }

        if (data.weight != null && Number(data.weight) < 0) {
          throw new Error('El peso debe ser mayor o igual a cero.')
        }

        if (data.barcode) {
          const barcode = String(data.barcode).trim()
          if (barcode) {
            const existing = await req.payload.find({
              collection: 'products',
              where: { barcode: { equals: barcode } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            const conflict = existing.docs[0]
            const currentId = originalDoc?.id ?? data.id
            if (conflict && String(conflict.id) !== String(currentId)) {
              throw new Error('El código de barras ya está registrado en otro producto.')
            }
          }
        }

        if (data.subcategory && data.category) {
          const subId =
            typeof data.subcategory === 'object' ? data.subcategory.id : data.subcategory
          const catId = typeof data.category === 'object' ? data.category.id : data.category

          const sub = await req.payload.findByID({
            collection: 'subcategories',
            id: String(subId),
            depth: 0,
            overrideAccess: true,
          })

          const subCategoryId =
            typeof sub.category === 'object' ? sub.category?.id : sub.category

          if (String(subCategoryId) !== String(catId)) {
            throw new Error('La subcategoría no pertenece a la categoría seleccionada.')
          }
        }

        if (data.status === 'inactive' || data.status === 'discontinued') {
          data.active = false
        } else if (data.status === 'active') {
          data.active = true
        }

        return data
      },
    ],
  },
  timestamps: true,
}
