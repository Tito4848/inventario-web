import { logout } from '@payloadcms/next/auth'
import config from '@payload-config'

import { buildClearAuthCookie } from '@/lib/auth/cookies'

export async function POST() {
  try {
    await logout({ config, allSessions: false })

    return Response.json(
      { message: 'Logout successful' },
      {
        headers: {
          'Set-Cookie': buildClearAuthCookie(),
        },
      },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al cerrar sesión'
    return Response.json({ error: message }, { status: 500 })
  }
}
