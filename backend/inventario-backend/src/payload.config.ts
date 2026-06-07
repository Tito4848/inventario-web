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
import { Products } from './collections/Products'
import { StockLevels } from './collections/StockLevels'
import { StockLots } from './collections/StockLots'
import { StockMovements } from './collections/StockMovements'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    Categories,
    Units,
    UnitEquivalences,
    Warehouses,
    Sections,
    Racks,
    Products,
    StockLevels,
    StockLots,
    StockMovements,
  ],
  editor: lexicalEditor(),
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
