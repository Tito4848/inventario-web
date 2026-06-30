import { getPayload } from 'payload'
import config from '@payload-config'

import { canReadSales, canReportSales } from '@/access/salesAccess'
import { requireAuth } from '@/lib/auth/requireAuth'
import { computeSaleStats } from '@/lib/sales/stats'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReadSales(auth.user) && !canReportSales(auth.user)) return forbidden()

  const payload = await getPayload({ config })
  const stats = await computeSaleStats(payload, auth.user)

  return Response.json(stats)
}
