import { refresh } from '@payloadcms/next/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

import { enforceRateLimit } from '@/lib/auth/rateLimit'
import { sanitizeUser } from '@/lib/auth/sanitizeUser'
import type { User } from '@/payload-types'

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'refresh')
  if (limited) return limited

  try {
    const refreshResult = await refresh({ config })

    if (!refreshResult.success) {
      return Response.json({ error: 'Sesión expirada' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return Response.json({ error: 'Sesión expirada' }, { status: 401 })
    }

    return Response.json({
      user: sanitizeUser(user as User),
      message: refreshResult.message,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al renovar sesión'
    return Response.json({ error: message }, { status: 401 })
  }
}
