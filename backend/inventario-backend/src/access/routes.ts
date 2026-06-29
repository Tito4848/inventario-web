import type { AppModule } from './roleMatrix'

type RouteRule = { pattern: RegExp; module: AppModule | null; requireAuth?: boolean }

/** Rutas /app protegidas por módulo RBAC */
const APP_ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/app\/?$/, module: 'dashboard' },
  { pattern: /^\/app\/portal\/?/, module: 'portal' },
  { pattern: /^\/app\/catalog\/?/, module: 'products' },
  { pattern: /^\/app\/stock\/?/, module: 'stock' },
  { pattern: /^\/app\/movements\/?/, module: 'movements' },
  { pattern: /^\/app\/kardex\/?/, module: 'kardex' },
  { pattern: /^\/app\/analytics\/?/, module: 'analytics' },
  { pattern: /^\/app\/notificaciones\/?/, module: 'notifications' },
  { pattern: /^\/app\/productos\/?/, module: 'products' },
  { pattern: /^\/app\/categorias\/?/, module: 'categories' },
  { pattern: /^\/app\/subcategorias\/?/, module: 'categories' },
  { pattern: /^\/app\/unidades\/?/, module: 'products' },
  { pattern: /^\/app\/equivalencias\/?/, module: 'products' },
  { pattern: /^\/app\/proveedores\/?/, module: 'suppliers' },
  { pattern: /^\/app\/clientes\/?/, module: 'customers' },
  { pattern: /^\/app\/compras\/?/, module: 'purchases' },
  { pattern: /^\/app\/ventas\/?/, module: 'sales' },
  { pattern: /^\/app\/movimientos\/?/, module: 'movements' },
  { pattern: /^\/app\/reportes\/?/, module: 'reports' },
  { pattern: /^\/app\/auditoria\/?/, module: 'audit' },
  { pattern: /^\/app\/configuracion\/?/, module: 'settings' },
  { pattern: /^\/app\/usuarios\/?/, module: 'users' },
]

/** APIs custom protegidas por módulo RBAC */
const API_ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/api\/dashboard\/stats\/?$/, module: 'dashboard' },
  { pattern: /^\/api\/dashboard\/analytics\/?$/, module: 'analytics' },
  { pattern: /^\/api\/inventory\/stock\/?$/, module: 'stock' },
  { pattern: /^\/api\/inventory\/kardex\/?$/, module: 'kardex' },
  { pattern: /^\/api\/inventory\/movements\/?$/, module: 'movements' },
  { pattern: /^\/api\/enterprise\/?$/, module: 'dashboard' },
  { pattern: /^\/api\/users\/me\/?$/, module: null, requireAuth: true },
  { pattern: /^\/api\/users\/manage\/?$/, module: 'users' },
  { pattern: /^\/api\/users\/manage\/[^/]+\/?$/, module: 'users' },
  { pattern: /^\/api\/users\/manage\/[^/]+\/(activate|deactivate|reset-password)\/?$/, module: 'users' },
  { pattern: /^\/api\/products\/manage\/?$/, module: 'products' },
  { pattern: /^\/api\/products\/manage\/[^/]+\/?$/, module: 'products' },
  { pattern: /^\/api\/products\/manage\/[^/]+\/(activate|deactivate)\/?$/, module: 'products' },
]

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/users/login',
  '/api/users/logout',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/public/',
]

export type RouteAccessRequirement = {
  module: AppModule | null
  requireAuth: boolean
}

export function resolveAppRouteAccess(pathname: string): RouteAccessRequirement | null {
  for (const rule of APP_ROUTE_RULES) {
    if (rule.pattern.test(pathname)) {
      return { module: rule.module, requireAuth: true }
    }
  }
  if (pathname.startsWith('/app/')) {
    return { module: 'dashboard', requireAuth: true }
  }
  return null
}

export function resolveApiRouteAccess(pathname: string): RouteAccessRequirement | null {
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return null
  }

  for (const rule of API_ROUTE_RULES) {
    if (rule.pattern.test(pathname)) {
      return { module: rule.module, requireAuth: rule.requireAuth ?? true }
    }
  }

  return null
}

export function isPublicFrontendPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/promociones') ||
    pathname.startsWith('/legal/') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  )
}
