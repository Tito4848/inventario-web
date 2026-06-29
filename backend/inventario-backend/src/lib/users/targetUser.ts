import { getPayload } from 'payload'
import config from '@payload-config'

import { canEditUser } from '@/access/usersAccess'
import type { User } from '@/payload-types'

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
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
