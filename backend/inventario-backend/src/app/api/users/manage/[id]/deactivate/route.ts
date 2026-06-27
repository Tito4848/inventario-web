import { getPayload } from 'payload'
import config from '@payload-config'

import { canToggleUserStatus, sanitizeUserForList } from '@/access/usersAccess'
import { requireAuth } from '@/lib/auth/requireAuth'
import type { User } from '@/payload-types'

import { getTargetUser } from '../../route'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id } = await context.params
  const target = await getTargetUser(id, auth.user)
  if (target instanceof Response) return target

  if (!canToggleUserStatus(auth.user, (target.roles as string[]) || [])) {
    return forbidden()
  }

  const payload = await getPayload({ config })
  const updated = await payload.update({
    collection: 'users',
    id,
    data: { status: 'inactive' },
    overrideAccess: false,
    user: auth.user,
  })

  return Response.json({ doc: sanitizeUserForList(updated as User) })
}
