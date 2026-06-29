export type RateLimitAction =
  | 'login'
  | 'forgotPassword'
  | 'resetPassword'
  | 'changePassword'
  | 'refresh'

type RateLimitRule = { max: number; windowMs: number }

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Producción — límites estrictos contra abuso */
const PRODUCTION_LIMITS: Record<RateLimitAction, RateLimitRule> = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  forgotPassword: { max: 5, windowMs: 15 * 60 * 1000 },
  resetPassword: { max: 5, windowMs: 15 * 60 * 1000 },
  changePassword: { max: 10, windowMs: 15 * 60 * 1000 },
  /** Renovaciones legítimas de sesión (intervalo ~50 min + reintentos al cargar) */
  refresh: { max: 120, windowMs: 15 * 60 * 1000 },
}

/** Desarrollo — ventana corta y cupo alto para evitar bloqueos en HMR / Strict Mode */
const DEVELOPMENT_LIMITS: Record<RateLimitAction, RateLimitRule> = {
  login: { max: 500, windowMs: 60 * 1000 },
  forgotPassword: { max: 100, windowMs: 60 * 1000 },
  resetPassword: { max: 100, windowMs: 60 * 1000 },
  changePassword: { max: 100, windowMs: 60 * 1000 },
  refresh: { max: 500, windowMs: 60 * 1000 },
}

export function isRateLimitEnabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED !== 'true'
}

function getLimits(): Record<RateLimitAction, RateLimitRule> {
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_LIMITS
  }
  return PRODUCTION_LIMITS
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

/**
 * Clave de bucket por acción.
 * - refresh: por cookie de sesión (evita colisión de IP en localhost/NAT)
 * - resto: por IP del cliente
 */
export function getRateLimitKey(req: Request, action: RateLimitAction): string {
  if (action === 'refresh') {
    const cookie = req.headers.get('cookie') ?? ''
    const match = cookie.match(/(?:^|;\s*)payload-token=([^;]+)/)
    if (match?.[1]) {
      const token = decodeURIComponent(match[1])
      return `session:${token.slice(-24)}`
    }
  }

  const ip = getClientIp(req)
  if (ip === 'unknown' && process.env.NODE_ENV === 'development') {
    return 'dev-localhost'
  }

  return ip
}

export function checkRateLimit(
  key: string,
  action: RateLimitAction,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  if (!isRateLimitEnabled()) {
    return { allowed: true }
  }

  const limits = getLimits()
  const rule = limits[action]
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

/** Aplica rate limit a partir del request; devuelve Response 429 o null si permitido. */
export function enforceRateLimit(
  req: Request,
  action: RateLimitAction,
): Response | null {
  const key = getRateLimitKey(req, action)
  const result = checkRateLimit(key, action)
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSeconds, action)
  }
  return null
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  action?: RateLimitAction,
): Response {
  const messages: Partial<Record<RateLimitAction, string>> = {
    login: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.',
    forgotPassword:
      'Demasiadas solicitudes de recuperación de contraseña. Espera unos minutos e inténtalo de nuevo.',
    resetPassword:
      'Demasiados intentos de restablecimiento de contraseña. Espera unos minutos e inténtalo de nuevo.',
    changePassword:
      'Demasiados intentos de cambio de contraseña. Espera unos minutos e inténtalo de nuevo.',
    refresh: 'Demasiadas renovaciones de sesión. Espera un momento e inténtalo de nuevo.',
  }

  return Response.json(
    {
      error:
        (action && messages[action]) ||
        'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  )
}

/** Rutas Payload sin handler propio — rate limit solo en middleware */
export const MIDDLEWARE_RATE_LIMITED_PATHS: Record<string, RateLimitAction> = {
  '/api/users/login': 'login',
  '/api/users/forgot-password': 'forgotPassword',
  '/api/users/reset-password': 'resetPassword',
}

/** Rutas con handler propio — rate limit solo en el Route Handler (evita doble conteo) */
export const ROUTE_HANDLER_RATE_LIMITED_PATHS: Record<string, RateLimitAction> = {
  '/api/auth/login': 'login',
  '/api/auth/refresh': 'refresh',
  '/api/auth/change-password': 'changePassword',
}

export function resolveMiddlewareRateLimitAction(pathname: string): RateLimitAction | null {
  if (ROUTE_HANDLER_RATE_LIMITED_PATHS[pathname]) {
    return null
  }
  return MIDDLEWARE_RATE_LIMITED_PATHS[pathname] ?? null
}

/** Expuesto para tests */
export function resetRateLimitBucketsForTests(): void {
  buckets.clear()
}

export function getRateLimitLimitsForTests(): Record<RateLimitAction, RateLimitRule> {
  return getLimits()
}
