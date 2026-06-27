import { getPayload } from 'payload'
import config from '@payload-config'

import type { User } from '@/payload-types'

export async function requireAuth(req: Request): Promise<{ user: User } | Response> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  return { user: user as User }
}
