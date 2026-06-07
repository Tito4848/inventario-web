import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['admin'],
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Operador', value: 'operator' },
        { label: 'Consulta', value: 'viewer' },
      ],
      saveToJWT: true,
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Nombre completo',
    },
  ],
}
