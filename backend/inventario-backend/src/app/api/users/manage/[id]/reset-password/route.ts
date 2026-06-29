import { getPayload } from 'payload'
import config from '@payload-config'

import { canResetUserPassword } from '@/access/usersAccess'
import { requireAuth } from '@/lib/auth/requireAuth'

import { getTargetUser } from '@/lib/users/targetUser'

type RouteContext = { params: Promise<{ id: string }> }

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (!canResetUserPassword(auth.user)) return forbidden()

  const { id } = await context.params
  const target = await getTargetUser(id, auth.user)
  if (target instanceof Response) return target

  try {
    const payload = await getPayload({ config })

    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email: target.email },
      disableEmail: false,
    })

    return Response.json({
      message: 'Se envió el enlace de restablecimiento de contraseña',
      token: process.env.NODE_ENV === 'development' ? token : undefined,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo restablecer la contraseña'
    return Response.json({ error: message }, { status: 400 })
  }
}
