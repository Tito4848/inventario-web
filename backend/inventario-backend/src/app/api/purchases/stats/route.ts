import { getPayload } from 'payload'
import config from '@payload-config'

import { canReadPurchases, canReportPurchases } from '@/access/purchasesAccess'
import { computePurchaseStats } from '@/lib/purchases/stats'
import { requireAuth } from '@/lib/auth/requireAuth'

function forbidden() {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(req: Request) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  if (!canReadPurchases(auth.user) && !canReportPurchases(auth.user)) return forbidden()

  const payload = await getPayload({ config })
  const stats = await computePurchaseStats(payload, auth.user)

  return Response.json(stats)
}
