import type { User } from '@/payload-types'

const SENSITIVE_KEYS = new Set([
  'password',
  'hash',
  'salt',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'loginAttempts',
  'lockUntil',
  'sessions',
])

export function sanitizeUser(user: User | null | undefined): Omit<User, 'password' | 'hash' | 'salt'> | null {
  if (!user) return null

  const safe: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(user)) {
    if (SENSITIVE_KEYS.has(key)) continue
    safe[key] = value
  }

  return safe as Omit<User, 'password' | 'hash' | 'salt'>
}
