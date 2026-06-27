/**
 * Decodifica el payload de un JWT de Payload (sin verificar firma).
 * La verificación completa la realiza payload.auth() en rutas API.
 * En middleware solo se usa para RBAC de rutas /app y APIs protegidas.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(padded)
    const parsed = JSON.parse(json) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function extractRolesFromToken(token: string | undefined | null): string[] | null {
  if (!token) return null

  const payload = decodeJwtPayload(token)
  if (!payload) return null

  const roles = payload.roles
  if (Array.isArray(roles) && roles.every((r) => typeof r === 'string')) {
    return roles as string[]
  }

  const user = payload.user
  if (user && typeof user === 'object' && !Array.isArray(user)) {
    const userRoles = (user as Record<string, unknown>).roles
    if (Array.isArray(userRoles) && userRoles.every((r) => typeof r === 'string')) {
      return userRoles as string[]
    }
  }

  return null
}

export function getTokenFromRequest(headers: {
  get(name: string): string | null
}): string | null {
  const auth = headers.get('authorization')
  if (auth?.startsWith('JWT ')) return auth.slice(4).trim()

  const cookie = headers.get('cookie')
  if (!cookie) return null

  const match = cookie.match(/(?:^|;\s*)payload-token=([^;]+)/)
  if (!match?.[1]) return null

  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}
