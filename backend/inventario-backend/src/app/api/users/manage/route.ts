import { getPayload } from 'payload'
import config from '@payload-config'

import {
  canCreateUsers,
  canDeleteUsers,
  canEditUser,
  canResetUserPassword,
  canToggleUserStatus,
  canViewUsersModule,
  sanitizeUserForList,
} from '@/access/usersAccess'
import { buildUserListWhere, parseUserListQuery } from '@/lib/users/listQuery'
import { requireAuth } from '@/lib/auth/requireAuth'
import { validatePassword } from '@/lib/auth/validation'
import { isValidEmail, normalizeEmail } from '@/lib/auth/validation'
import type { User } from '@/payload-types'
import type { UserRole } from '@/access/roleMatrix'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canViewUsersModule(auth.user)) return forbidden()

  const url = new URL(req.url)
  const query = parseUserListQuery(url)
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'users',
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    where: buildUserListWhere(query),
    depth: 0,
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({
    docs: result.docs.map((doc) => sanitizeUserForList(doc as User)),
    totalDocs: result.totalDocs,
    limit: result.limit,
    page: result.page,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  })
}

export async function POST(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canCreateUsers(auth.user)) return forbidden()

  try {
    const body = (await req.json()) as {
      email?: unknown
      password?: unknown
      fullName?: unknown
      roles?: unknown
      status?: unknown
    }

    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : undefined
    const roles = (Array.isArray(body.roles)
      ? body.roles.filter((r): r is string => typeof r === 'string')
      : ['invitado']) as UserRole[]
    const status =
      body.status === 'inactive' || body.status === 'locked' ? body.status : 'active'

    if (!isValidEmail(email)) {
      return Response.json({ error: 'Correo electrónico inválido' }, { status: 400 })
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.ok) {
      return Response.json({ error: passwordCheck.message }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const created = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        fullName,
        roles,
        status,
        createdBy: auth.user.id,
      },
      overrideAccess: false,
      user: auth.user,
    })

    return Response.json({ doc: sanitizeUserForList(created as User) }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo crear el usuario'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function getTargetUser(id: string, actor: User): Promise<User | Response> {
  const payload = await getPayload({ config })
  try {
    const target = (await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: false,
      user: actor,
    })) as User
    return target
  } catch {
    return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
}

export async function assertCanModify(actor: User, target: User): Promise<Response | null> {
  if (!canEditUser(actor, (target.roles as string[]) || [])) {
    return forbidden()
  }
  return null
}

export { canDeleteUsers, canResetUserPassword, canToggleUserStatus }
