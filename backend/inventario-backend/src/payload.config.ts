import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Units } from './collections/Units'
import { UnitEquivalences } from './collections/UnitEquivalences'
import { Warehouses } from './collections/Warehouses'
import { Sections } from './collections/Sections'
import { Racks } from './collections/Racks'
import { Brands } from './collections/Brands'
import { Products } from './collections/Products'
import { StockLevels } from './collections/StockLevels'
import { StockLots } from './collections/StockLots'
import { StockMovements } from './collections/StockMovements'
import { Suppliers } from './collections/Suppliers'
import { Customers } from './collections/Customers'
import { PurchaseOrders } from './collections/PurchaseOrders'
import { SalesOrders } from './collections/SalesOrders'
import { AuditLogs } from './collections/AuditLogs'
import { Roles } from './collections/Roles'
import { Subcategories } from './collections/Subcategories'
import { Returns } from './collections/Returns'
import { Notifications } from './collections/Notifications'
import { Settings } from './collections/Settings'
import { KardexEntries } from './collections/KardexEntries'
import { getTrustedOrigins } from './lib/auth/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const trustedOrigins = getTrustedOrigins()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Roles,
    Categories,
    Subcategories,
    Brands,
    Units,
    UnitEquivalences,
    Warehouses,
    Sections,
    Racks,
    Products,
    StockLevels,
    StockLots,
    StockMovements,
    KardexEntries,
    Suppliers,
    Customers,
    PurchaseOrders,
    SalesOrders,
    AuditLogs,
    Returns,
    Notifications,
    Settings,
  ],
  editor: lexicalEditor(),
  cors: trustedOrigins,
  csrf: trustedOrigins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})
