import type { Payload } from 'payload'
import sharp from 'sharp'

import type { User } from '@/payload-types'

import {
  DEMO_USERS,
  SEED_PASSWORD,
  SEED_VERSION,
  TARGETS,
  WAREHOUSES,
  RACK_SECTIONS,
  RACKS_PER_SECTION,
} from '../lib/constants'
import {
  BRAND_NAMES,
  CATEGORY_NAMES,
  SUBCATEGORY_TEMPLATES,
  UNIT_DEFINITIONS,
  UNIT_EQUIVALENCE_DEFINITIONS,
} from '../lib/data'
import {
  countDocs,
  createSeedReq,
  logCount,
  logPhase,
  padCode,
  upsertByField,
  upsertSetting,
} from '../lib/helpers'
import type { SeedStats } from '../lib/helpers'
import { SeededRng } from '../lib/rng'

export type SeedContext = {
  payload: Payload
  rng: SeededRng
  stats: SeedStats
  ids: {
    admin?: User
    users: Record<string, User>
    media?: string
    units: Record<string, string>
    categories: Record<string, string>
    subcategories: string[]
    brands: string[]
    warehouses: Record<string, string>
    sections: Record<string, string>
    racks: string[]
    mainRack?: string
  }
}

export async function seedSettingsAndCompany(ctx: SeedContext): Promise<void> {
  logPhase('Empresa y configuración')
  const { payload } = ctx

  const companyProfile = {
    name: 'Distribuidora Andina SAC',
    tradeName: 'Distribuidora Andina',
    taxId: '20123456781',
    address: 'Av. Industrial 1250, Lima 15036, Perú',
    city: 'Lima',
    country: 'Perú',
    phone: '+51 1 456-7890',
    email: 'contacto@distribuidora-andina.demo',
    website: 'https://distribuidora-andina.demo',
    currency: 'PEN',
    taxRate: 18,
    fiscalRegime: 'Régimen General',
    logoAlt: 'Logo Distribuidora Andina',
  }

  await upsertSetting({
    payload,
    key: 'company.profile',
    description: 'Perfil empresarial principal',
    value: companyProfile,
  })

  await upsertSetting({
    payload,
    key: 'seed.metadata',
    description: 'Metadatos del seed de demostración',
    value: { version: SEED_VERSION, marker: 'seed:v1', completedAt: null },
  })

  ctx.stats.settings = await countDocs(payload, 'settings')
  logCount('Configuraciones', ctx.stats.settings)
}

export async function seedUsers(ctx: SeedContext): Promise<void> {
  logPhase('Usuarios')
  const { payload } = ctx

  for (const userDef of DEMO_USERS) {
    const { id, created } = await upsertByField({
      payload,
      collection: 'users',
      field: 'email',
      value: userDef.email,
      data: {
        email: userDef.email,
        password: SEED_PASSWORD,
        fullName: userDef.fullName,
        roles: [...userDef.roles],
        status: 'active',
      },
    })

    const user = (await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
    })) as User

    ctx.ids.users[userDef.email] = user
    if (userDef.roles[0] === 'admin') ctx.ids.admin = user
    logCount(`${userDef.email} (${created ? 'creado' : 'actualizado'})`, 1)
  }

  ctx.stats.users = await countDocs(payload, 'users')
}

export async function seedMedia(ctx: SeedContext): Promise<void> {
  logPhase('Logo e imágenes placeholder')
  const { payload } = ctx

  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: 'Logo Distribuidora Andina' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    ctx.ids.media = String(existing.docs[0].id)
  } else {
    const buffer = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: { r: 14, g: 116, b: 144, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'Logo Distribuidora Andina' },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: 'logo-distribuidora-andina.png',
        size: buffer.length,
      },
      overrideAccess: true,
    })
    ctx.ids.media = String(doc.id)
  }

  const placeholder = await payload.find({
    collection: 'media',
    where: { alt: { equals: 'Producto placeholder seed' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (!placeholder.docs[0]) {
    const buffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 226, g: 232, b: 240 },
      },
    })
      .png()
      .toBuffer()

    await payload.create({
      collection: 'media',
      data: { alt: 'Producto placeholder seed' },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: 'product-placeholder.png',
        size: buffer.length,
      },
      overrideAccess: true,
    })
  }

  ctx.stats.media = await countDocs(payload, 'media')
  logCount('Archivos media', ctx.stats.media)
}

export async function seedCatalog(ctx: SeedContext): Promise<void> {
  logPhase('Unidades, categorías, subcategorías y marcas')
  const { payload } = ctx

  for (const unit of UNIT_DEFINITIONS) {
    const { id } = await upsertByField({
      payload,
      collection: 'units',
      field: 'abbreviation',
      value: unit.abbreviation,
      data: { name: unit.name, abbreviation: unit.abbreviation, active: true },
    })
    ctx.ids.units[unit.abbreviation] = id
  }

  for (let i = 0; i < CATEGORY_NAMES.length; i++) {
    const name = CATEGORY_NAMES[i]
    const code = padCode('CAT', i + 1, 2)
    const { id } = await upsertByField({
      payload,
      collection: 'categories',
      field: 'code',
      value: code,
      data: { code, name, active: true, description: `Categoría ${name}` },
    })
    ctx.ids.categories[name] = id
  }

  let subIndex = 1
  for (const catName of CATEGORY_NAMES) {
    const subs = SUBCATEGORY_TEMPLATES[catName] ?? ['General', 'Varios', 'Especial', 'Premium']
    const categoryId = ctx.ids.categories[catName]
    for (const subName of subs) {
      if (subIndex > TARGETS.subcategories) break
      const code = padCode('SUB', subIndex, 3)
      const { id } = await upsertByField({
        payload,
        collection: 'subcategories',
        field: 'code',
        value: code,
        data: {
          code,
          name: subName,
          category: categoryId,
          isActive: true,
          description: `${subName} en ${catName}`,
        },
      })
      ctx.ids.subcategories.push(id)
      subIndex++
    }
  }

  for (let i = 0; i < Math.min(BRAND_NAMES.length, TARGETS.brands); i++) {
    const name = BRAND_NAMES[i]
    const code = padCode('BRD', i + 1, 3)
    const { id } = await upsertByField({
      payload,
      collection: 'brands',
      field: 'code',
      value: code,
      data: { code, name, active: true },
    })
    ctx.ids.brands.push(id)
  }

  const existingEq = await countDocs(payload, 'unit-equivalences', {
    label: { contains: 'SD-EQ' },
  })
  if (existingEq < TARGETS.unitEquivalences) {
    for (let i = existingEq; i < UNIT_EQUIVALENCE_DEFINITIONS.length; i++) {
      const def = UNIT_EQUIVALENCE_DEFINITIONS[i]
      const fromId = ctx.ids.units[def.from]
      const toId = ctx.ids.units[def.to]
      if (!fromId || !toId) continue
      const label = `SD-EQ: ${def.label}`
      await upsertByField({
        payload,
        collection: 'unit-equivalences',
        field: 'label',
        value: label,
        data: {
          label,
          fromUnit: fromId,
          toUnit: toId,
          factor: def.factor,
          active: true,
        },
      })
    }
  }

  ctx.stats.units = await countDocs(payload, 'units')
  ctx.stats.categories = await countDocs(payload, 'categories')
  ctx.stats.subcategories = await countDocs(payload, 'subcategories')
  ctx.stats.brands = await countDocs(payload, 'brands')
  ctx.stats.unitEquivalences = await countDocs(payload, 'unit-equivalences')
  logCount('Unidades', ctx.stats.units)
  logCount('Categorías', ctx.stats.categories)
  logCount('Subcategorías', ctx.stats.subcategories)
  logCount('Marcas', ctx.stats.brands)
  logCount('Equivalencias', ctx.stats.unitEquivalences)
}

export async function seedWarehouses(ctx: SeedContext): Promise<void> {
  logPhase('Almacenes, secciones y racks')
  const { payload } = ctx

  for (const wh of WAREHOUSES) {
    const { id } = await upsertByField({
      payload,
      collection: 'warehouses',
      field: 'code',
      value: wh.code,
      data: { code: wh.code, name: wh.name, address: wh.address, active: true },
    })
    ctx.ids.warehouses[wh.code] = id
  }

  const mainWarehouseId = ctx.ids.warehouses['WH-MAIN']
  let rackCount = 0

  for (const sectionLetter of RACK_SECTIONS) {
    const sectionCode = `SEC-${sectionLetter}`
    const { id: sectionId } = await upsertByField({
      payload,
      collection: 'sections',
      field: 'code',
      value: sectionCode,
      data: {
        warehouse: mainWarehouseId,
        code: sectionCode,
        name: `Sección ${sectionLetter}`,
        active: true,
      },
    })
    ctx.ids.sections[sectionLetter] = sectionId

    for (let r = 1; r <= RACKS_PER_SECTION; r++) {
      if (rackCount >= TARGETS.racks) break
      const rackCode = `${sectionLetter}-${String(r).padStart(2, '0')}`
      const { id: rackId } = await upsertByField({
        payload,
        collection: 'racks',
        field: 'code',
        value: rackCode,
        data: {
          section: sectionId,
          code: rackCode,
          name: `Rack ${rackCode}`,
          active: true,
        },
      })
      ctx.ids.racks.push(rackId)
      if (!ctx.ids.mainRack) ctx.ids.mainRack = rackId
      rackCount++
    }
  }

  ctx.stats.warehouses = await countDocs(payload, 'warehouses')
  ctx.stats.sections = await countDocs(payload, 'sections')
  ctx.stats.racks = await countDocs(payload, 'racks')
  logCount('Almacenes', ctx.stats.warehouses)
  logCount('Secciones', ctx.stats.sections)
  logCount('Racks', ctx.stats.racks)
}

export async function seedPromotions(ctx: SeedContext): Promise<void> {
  logPhase('Promociones (settings)')
  const { payload, rng } = ctx
  const { PROMOTION_TITLES } = await import('../lib/data')

  const promotions = PROMOTION_TITLES.slice(0, TARGETS.promotions).map((title, i) => ({
    id: padCode('PROMO', i + 1, 3),
    title,
    description: `Promoción válida en tiendas participantes. ${title}.`,
    discountPercent: rng.int(5, 40),
    active: rng.int(0, 10) > 2,
    startDate: randomPastDate(rng, 60),
    endDate: randomFutureDate(rng, 90),
    category: CATEGORY_NAMES[i % CATEGORY_NAMES.length],
  }))

  await upsertSetting({
    payload,
    key: 'promotions.catalog',
    description: 'Catálogo de promociones de demostración',
    value: { items: promotions, total: promotions.length },
    updatedBy: ctx.ids.admin?.id,
  })

  ctx.stats.promotions = promotions.length
  logCount('Promociones', ctx.stats.promotions)
}

function randomPastDate(rng: SeededRng, days: number): string {
  const now = Date.now()
  return new Date(now - rng.int(1, days) * 24 * 60 * 60 * 1000).toISOString()
}

function randomFutureDate(rng: SeededRng, days: number): string {
  const now = Date.now()
  return new Date(now + rng.int(1, days) * 24 * 60 * 60 * 1000).toISOString()
}

export function createEmptyContext(payload: Payload): SeedContext {
  return {
    payload,
    rng: new SeededRng(42),
    stats: {},
    ids: {
      users: {},
      units: {},
      categories: {},
      subcategories: [],
      brands: [],
      warehouses: {},
      sections: {},
      racks: [],
    },
  }
}

export { createSeedReq }
