import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canDeleteUsers,
  canEditUser,
  sanitizeUserForList,
} from '@/access/usersAccess'
import { requireAuth } from '@/lib/auth/requireAuth'
import { validatePassword } from '@/lib/auth/validation'
import { isValidEmail, normalizeEmail } from '@/lib/auth/validation'
import type { User } from '@/payload-types'

import { getTargetUser } from '@/lib/users/targetUser'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireAuth(_req)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const target = await getTargetUser(id, auth.user)
  if (target instanceof Response) return target

  if (!canEditUser(auth.user, (target.roles as string[]) || []) && auth.user.id !== id) {
    return forbidden()
  }

  return Response.json({ doc: sanitizeUserForList(target) })
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const target = await getTargetUser(id, auth.user)
  if (target instanceof Response) return target

  const isSelf = auth.user.id === id
  if (!isSelf && !canEditUser(auth.user, (target.roles as string[]) || [])) {
    return forbidden()
  }

  try {
    const body = (await req.json()) as {
      email?: unknown
      password?: unknown
      fullName?: unknown
      roles?: unknown
      status?: unknown
    }

    const data: Record<string, unknown> = {}

    if (typeof body.fullName === 'string') {
      data.fullName = body.fullName.trim()
    }

    if (typeof body.email === 'string' && isSelf) {
      const email = normalizeEmail(body.email)
      if (!isValidEmail(email)) {
        return Response.json({ error: 'Correo electrónico inválido' }, { status: 400 })
      }
      data.email = email
    }

    if (typeof body.password === 'string' && body.password) {
      const passwordCheck = validatePassword(body.password)
      if (!passwordCheck.ok) {
        return Response.json({ error: passwordCheck.message }, { status: 400 })
      }
      data.password = body.password
    }

    if (!isSelf) {
      if (body.status === 'active' || body.status === 'inactive' || body.status === 'locked') {
        data.status = body.status
      }

      if (Array.isArray(body.roles) && auth.user.roles?.includes('admin')) {
        data.roles = body.roles.filter((r): r is string => typeof r === 'string')
      }
    }

    const payload = await getPayload({ config })

    const updated = await payload.update({
      collection: 'users',
      id,
      data,
      overrideAccess: false,
      user: auth.user,
    })

    return Response.json({ doc: sanitizeUserForList(updated as User) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo actualizar el usuario'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireAuth(_req)
  if (auth instanceof Response) return auth

  if (!canDeleteUsers(auth.user)) return forbidden()

  const { id } = await context.params
  if (auth.user.id === id) {
    return Response.json({ error: 'No puede eliminar su propia cuenta' }, { status: 400 })
  }

  const target = await getTargetUser(id, auth.user)
  if (target instanceof Response) return target

  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    id,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({ message: 'Usuario eliminado' })
}
