import 'dotenv/config'

import { getPayload } from 'payload'
import config from '@payload-config'

import { SEED_VERSION } from './lib/constants'
import { upsertSetting } from './lib/helpers'
import {
  createEmptyContext,
  seedCatalog,
  seedMedia,
  seedPromotions,
  seedSettingsAndCompany,
  seedUsers,
  seedWarehouses,
} from './phases/foundation'
import { seedCustomers, seedProducts, seedSuppliers } from './phases/entities'
import {
  seedAuditLogs,
  seedHistoricalMovements,
  seedInitialStock,
  seedNotifications,
  seedPurchases,
  seedSales,
} from './phases/transactions'

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════')
  console.log('  SEED — Distribuidora Andina ERP Demo')
  console.log(`  Versión: ${SEED_VERSION}`)
  console.log('═══════════════════════════════════════════')

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const ctx = createEmptyContext(payload)

  const start = Date.now()

  await seedSettingsAndCompany(ctx)
  await seedUsers(ctx)
  await seedMedia(ctx)
  await seedCatalog(ctx)
  await seedWarehouses(ctx)
  await seedSuppliers(ctx)
  await seedCustomers(ctx)
  await seedProducts(ctx)
  await seedInitialStock(ctx)
  await seedHistoricalMovements(ctx)
  await seedPurchases(ctx)
  await seedSales(ctx)
  await seedNotifications(ctx)
  await seedAuditLogs(ctx)
  await seedPromotions(ctx)

  await upsertSetting({
    payload,
    key: 'seed.metadata',
    description: 'Metadatos del seed de demostración',
    value: {
      version: SEED_VERSION,
      marker: 'seed:v1',
      completedAt: new Date().toISOString(),
      stats: ctx.stats,
    },
    updatedBy: ctx.ids.admin?.id,
  })

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log('\n═══════════════════════════════════════════')
  console.log('  SEED COMPLETADO')
  console.log(`  Tiempo: ${elapsed}s`)
  console.log('═══════════════════════════════════════════')
  console.log('\nResumen de registros:')
  for (const [key, value] of Object.entries(ctx.stats)) {
    console.log(`  ${key}: ${value}`)
  }
  console.log('\nUsuarios demo (contraseña: Demo2024!):')
  for (const email of Object.keys(ctx.ids.users)) {
    console.log(`  • ${email}`)
  }
}

main().catch((err) => {
  console.error('\n✗ Error en seed:', err)
  process.exit(1)
})
