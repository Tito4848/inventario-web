import type { CollectionConfig } from 'payload'

import {
  usersCreateAccess,
  usersDeleteAccess,
  usersReadAccess,
  usersUpdateAccess,
} from '@/access/roles'
import { assertRolesAllowed, canAssignRoles } from '@/access/usersAccess'
import { getFrontendUrl, TOKEN_EXPIRATION_SECONDS, authCookieOptions } from '@/lib/auth/config'
import { validatePassword } from '@/lib/auth/validation'
import type { User } from '@/payload-types'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'roles', 'status', 'lastLoginAt', 'createdAt'],
  },
  auth: {
    tokenExpiration: TOKEN_EXPIRATION_SECONDS,
    maxLoginAttempts: 5,
    lockTime: 600000,
    cookies: {
      secure: authCookieOptions.secure,
      sameSite: authCookieOptions.sameSite,
    },
    forgotPassword: {
      generateEmailSubject: () => 'Recuperar contraseña — Inventario Pro',
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`
        return `
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p><a href="${resetUrl}">Restablecer contraseña</a></p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <p>El enlace expira en 1 hora.</p>
        `
      },
    },
  },
  access: {
    read: usersReadAccess,
    create: usersCreateAccess,
    update: usersUpdateAccess,
    delete: usersDeleteAccess,
  },
  timestamps: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Almacenero', value: 'warehouse' },
        { label: 'Cliente', value: 'client' },
        { label: 'Invitado', value: 'invitado' },
        { label: 'Cliente (legacy: guest)', value: 'guest' },
        { label: 'Vendedor (legacy)', value: 'seller' },
        { label: 'Operador (legacy)', value: 'operator' },
        { label: 'Consulta (legacy)', value: 'viewer' },
      ],
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => canAssignRoles(user as User),
      },
      admin: {
        description:
          'Roles legacy (guest, seller, operator, viewer) se conservan en usuarios existentes; asignar solo los cinco roles canónicos.',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Nombre completo',
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      defaultValue: 'active',
      required: true,
      index: true,
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'Bloqueado', value: 'locked' },
      ],
      saveToJWT: true,
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: 'Último acceso',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'customerProfile',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Perfil de cliente',
      admin: {
        description: 'Vincula este usuario con su ficha de cliente (rol Cliente).',
      },
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
      async ({ data, operation: _operation }) => {
        if (!data?.password) return data

        const passwordCheck = validatePassword(data.password)
        if (!passwordCheck.ok) {
          throw new Error(passwordCheck.message)
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        if (!data) return data

        if (operation === 'create') {
          if (!data.roles?.length) {
            data.roles = ['invitado']
          }

          if (Array.isArray(data.roles) && data.roles.includes('admin') && data.roles.length > 1) {
            data.roles = ['admin']
          }

          if (req.user?.id && !data.createdBy) {
            data.createdBy = req.user.id
          }
        }

        if (operation === 'update' && data.roles && req.user) {
          assertRolesAllowed(req.user as User, data.roles as string[])
        }

        if (
          operation === 'update' &&
          req.user &&
          !canAssignRoles(req.user as User) &&
          data.roles
        ) {
          data.roles = (originalDoc as User | undefined)?.roles
        }

        return data
      },
    ],
  },
}
