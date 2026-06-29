import type { Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

type AuditParams = {
  userId?: string | null
  action: string
  module: string
  resourceId?: string
  details?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

export async function writeAuditLog(
  params: AuditParams & { req: PayloadRequest },
): Promise<void> {
  const { req, userId, action, module, resourceId, details, ip, userAgent } = params

  await req.payload.create({
    collection: 'audit-logs',
    data: {
      user: userId ?? req.user?.id ?? undefined,
      action,
      module,
      resourceId,
      details,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
    depth: 0,
    overrideAccess: true,
    req,
  })
}

export async function writeAuditLogWithPayload(
  params: AuditParams & { payload: Payload; user?: User | null },
): Promise<void> {
  const { payload, user, userId, action, module, resourceId, details, ip, userAgent } = params

  await payload.create({
    collection: 'audit-logs',
    data: {
      user: userId ?? user?.id ?? undefined,
      action,
      module,
      resourceId,
      details,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
    depth: 0,
    overrideAccess: true,
  })
}

export function getClientMeta(req: Request): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent')
  return { ip, userAgent }
}
