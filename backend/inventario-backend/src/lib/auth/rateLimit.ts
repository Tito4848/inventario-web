type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  forgotPassword: { max: 5, windowMs: 15 * 60 * 1000 },
  resetPassword: { max: 5, windowMs: 15 * 60 * 1000 },
  changePassword: { max: 10, windowMs: 15 * 60 * 1000 },
  refresh: { max: 60, windowMs: 15 * 60 * 1000 },
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

export function checkRateLimit(
  key: string,
  action: keyof typeof LIMITS,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const rule = LIMITS[action]
  const bucketKey = `${action}:${key}`
  const now = Date.now()
  const existing = buckets.get(bucketKey)

  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + rule.windowMs })
    return { allowed: true }
  }

  if (existing.count >= rule.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  existing.count += 1
  buckets.set(bucketKey, existing)
  return { allowed: true }
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  )
}
