import { getPayload } from 'payload'
import config from '@payload-config'

import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/auth/rateLimit'
import { requireAuth } from '@/lib/auth/requireAuth'
import {
  normalizeEmail,
  validatePassword,
  validatePasswordConfirmation,
} from '@/lib/auth/validation'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limited = checkRateLimit(ip, 'changePassword')
  if (!limited.allowed) return rateLimitResponse(limited.retryAfterSeconds)

  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = (await req.json()) as {
      currentPassword?: unknown
      newPassword?: unknown
      confirmPassword?: unknown
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = body.confirmPassword

    if (!currentPassword) {
      return Response.json({ error: 'La contraseña actual es obligatoria.' }, { status: 400 })
    }

    const passwordCheck = validatePassword(newPassword)
    if (!passwordCheck.ok) {
      return Response.json({ error: passwordCheck.message }, { status: 400 })
    }

    const confirmCheck = validatePasswordConfirmation(newPassword, confirmPassword)
    if (!confirmCheck.ok) {
      return Response.json({ error: confirmCheck.message }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return Response.json(
        { error: 'La nueva contraseña debe ser diferente a la actual.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const email = normalizeEmail(auth.user.email)

    try {
      await payload.login({
        collection: 'users',
        data: { email, password: currentPassword },
      })
    } catch {
      return Response.json({ error: 'La contraseña actual no es correcta.' }, { status: 401 })
    }

    await payload.update({
      collection: 'users',
      id: auth.user.id,
      data: { password: newPassword },
      overrideAccess: false,
      user: auth.user,
    })

    return Response.json({ message: 'Contraseña actualizada correctamente' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo cambiar la contraseña'
    return Response.json({ error: message }, { status: 500 })
  }
}
