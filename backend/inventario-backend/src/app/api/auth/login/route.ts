import { getPayload } from 'payload'
import config from '@payload-config'

import {
  REMEMBER_TOKEN_EXPIRATION_SECONDS,
  TOKEN_EXPIRATION_SECONDS,
} from '@/lib/auth/config'
import { buildAuthCookie } from '@/lib/auth/cookies'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/auth/rateLimit'
import { sanitizeUser } from '@/lib/auth/sanitizeUser'
import { isValidEmail, normalizeEmail } from '@/lib/auth/validation'
import type { User } from '@/payload-types'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(ip, 'login')
  if (!limited.allowed) return rateLimitResponse(limited.retryAfterSeconds)

  try {
    const body = (await req.json()) as {
      email?: unknown
      password?: unknown
      remember?: unknown
    }

    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const remember = body.remember === true

    if (!isValidEmail(email) || !password) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    let loginResult: Awaited<ReturnType<typeof payload.login>>
    try {
      loginResult = await payload.login({
        collection: 'users',
        data: { email, password },
      })
    } catch {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const loggedInUser = loginResult.user as User & { status?: string }
    const accountStatus = loggedInUser.status ?? 'active'

    if (accountStatus === 'inactive') {
      return Response.json({ error: 'Cuenta inactiva. Contacte al administrador.' }, { status: 403 })
    }

    if (accountStatus === 'locked') {
      return Response.json({ error: 'Cuenta bloqueada. Contacte al administrador.' }, { status: 403 })
    }

    await payload.update({
      collection: 'users',
      id: loggedInUser.id,
      data: { lastLoginAt: new Date().toISOString() },
      overrideAccess: true,
    })

    if (!loginResult.token) {
      return Response.json({ error: 'No se pudo iniciar sesión' }, { status: 500 })
    }

    const maxAge = remember ? REMEMBER_TOKEN_EXPIRATION_SECONDS : TOKEN_EXPIRATION_SECONDS

    return Response.json(
      {
        user: sanitizeUser(loginResult.user as User),
        token: loginResult.token,
        exp: loginResult.exp,
        message: 'Login successful',
      },
      {
        headers: {
          'Set-Cookie': buildAuthCookie(loginResult.token, maxAge),
        },
      },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
    return Response.json({ error: message }, { status: 500 })
  }
}
