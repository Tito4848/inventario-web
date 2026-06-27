const isProduction = process.env.NODE_ENV === 'production'

export const AUTH_COOKIE_NAME = 'payload-token'

export const TOKEN_EXPIRATION_SECONDS = Number(process.env.AUTH_TOKEN_EXPIRATION || 7200)

export const REMEMBER_TOKEN_EXPIRATION_SECONDS = Number(
  process.env.AUTH_REMEMBER_EXPIRATION || 60 * 60 * 24 * 7,
)

export const authCookieOptions = {
  secure: isProduction,
  sameSite: (isProduction ? 'None' : 'Lax') as 'Lax' | 'None' | 'Strict',
  httpOnly: true,
  path: '/',
} as const

export function getTrustedOrigins(): string[] {
  const origins = new Set<string>()

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  const frontendUrl = process.env.FRONTEND_URL

  if (serverUrl) origins.add(serverUrl.replace(/\/$/, ''))
  if (frontendUrl) origins.add(frontendUrl.replace(/\/$/, ''))

  origins.add('http://localhost:3000')
  origins.add('http://localhost:5173')
  origins.add('http://127.0.0.1:3000')
  origins.add('http://127.0.0.1:5173')

  return [...origins]
}

export function getFrontendUrl(): string {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
}
