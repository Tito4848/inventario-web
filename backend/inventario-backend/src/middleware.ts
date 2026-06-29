import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  canAccessModuleWithRoles,
  getDefaultAppRouteForRoles,
  hasAdministrativeAppAccess,
} from '@/access/permissions'
import { isInvitadoOnly } from '@/access/usersAccess'
import { resolveApiRouteAccess, resolveAppRouteAccess } from '@/access/routes'
import {
  enforceRateLimit,
  resolveMiddlewareRateLimitAction,
} from '@/lib/auth/rateLimit'
import { extractRolesFromToken, getTokenFromRequest } from '@/lib/auth/jwt'

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}

function getRolesFromRequest(request: NextRequest): string[] | null {
  const token =
    request.cookies.get('payload-token')?.value ||
    getTokenFromRequest({ get: (name) => request.headers.get(name) })
  return extractRolesFromToken(token)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const rateLimitAction = resolveMiddlewareRateLimitAction(pathname)
  if (rateLimitAction && request.method === 'POST') {
    const limited = enforceRateLimit(request, rateLimitAction)
    if (limited) {
      return applySecurityHeaders(
        new NextResponse(limited.body, {
          status: limited.status,
          headers: limited.headers,
        }),
      )
    }
  }

  const roles = getRolesFromRequest(request)

  const appAccess = resolveAppRouteAccess(pathname)
  if (appAccess) {
    if (!roles) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    if (isInvitadoOnly(roles) || !hasAdministrativeAppAccess(roles)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = ''
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }

    if (appAccess.module && !canAccessModuleWithRoles(roles, appAccess.module)) {
      const fallback = getDefaultAppRouteForRoles(roles)
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = fallback
      redirectUrl.search = ''
      return applySecurityHeaders(NextResponse.redirect(redirectUrl))
    }
  }

  if (pathname.startsWith('/login') && roles) {
    const home = request.nextUrl.clone()
    home.pathname = getDefaultAppRouteForRoles(roles)
    home.search = ''
    return applySecurityHeaders(NextResponse.redirect(home))
  }

  const apiAccess = resolveApiRouteAccess(pathname)
  if (apiAccess) {
    if (!roles) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
    }

    if (isInvitadoOnly(roles) && apiAccess.module) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      )
    }

    if (apiAccess.module && !canAccessModuleWithRoles(roles, apiAccess.module)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      )
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/api/users/login',
    '/api/auth/login',
    '/api/users/forgot-password',
    '/api/users/reset-password',
    '/api/auth/:path*',
    '/api/dashboard/:path*',
    '/api/inventory/:path*',
    '/api/enterprise',
    '/api/users/me',
    '/api/users/manage/:path*',
    '/api/products/manage/:path*',
    '/app/:path*',
    '/login',
  ],
}
