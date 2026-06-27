import { authCookieOptions } from './config'

const COOKIE_NAME = 'payload-token'

export function buildAuthCookie(token: string, maxAgeSeconds: number): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${authCookieOptions.path}`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    `SameSite=${authCookieOptions.sameSite}`,
  ]

  if (authCookieOptions.secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

export function buildClearAuthCookie(): string {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=${authCookieOptions.path}`,
    'Max-Age=0',
    'HttpOnly',
    `SameSite=${authCookieOptions.sameSite}`,
  ]

  if (authCookieOptions.secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}
