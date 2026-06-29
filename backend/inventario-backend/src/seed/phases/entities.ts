import { CATEGORY_NAMES, FIRST_NAMES, LAST_NAMES, STREETS, CITIES, SUPPLIER_NAMES, PRODUCT_ADJECTIVES, PRODUCT_SIZES, BRAND_NAMES, SUBCATEGORY_TEMPLATES } from '../lib/data'
import { TARGETS } from '../lib/constants'
import {
  countDocs,
  generateDni,
  generateRuc,
  logCount,
  logPhase,
  padCode,
  upsertByField,
} from '../lib/helpers'
import type { SeedContext } from './foundation'

export async function seedSuppliers(ctx: SeedContext): Promise<void> {
  logPhase('Proveedores')
  const { payload, rng } = ctx

  const target = TARGETS.suppliers
  const existing = await countDocs(payload, 'suppliers', {
    taxId: { contains: 'SD-RUC' },
  })

  if (existing >= target) {
    ctx.stats.suppliers = existing
    logCount('Proveedores (ya completos)', existing)
    return
  }

  const startIndex = existing

  for (let i = startIndex; i < target; i++) {
    const taxId = `SD-RUC-${generateRuc(rng, i + 1)}`
    const name = SUPPLIER_NAMES[i % SUPPLIER_NAMES.length]
    const city = rng.pick(CITIES)
    const street = rng.pick(STREETS)
    const suffix = i >= SUPPLIER_NAMES.length ? ` ${Math.floor(i / SUPPLIER_NAMES.length) + 1}` : ''

    await upsertByField({
      payload,
      collection: 'suppliers',
      field: 'taxId',
      value: taxId,
      data: {
        businessName: `${name}${suffix}`,
        taxId,
        address: `${street} ${rng.int(100, 999)}, ${city}, Perú`,
        phone: `+51 ${rng.int(900, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}`,
        email: `proveedor${i + 1}@distribuidora-andina.demo`,
        contactName: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
        active: rng.int(0, 20) > 1,
      },
    })
  }

  ctx.stats.suppliers = await countDocs(payload, 'suppliers')
  logCount('Proveedores', ctx.stats.suppliers)
}

export async function seedCustomers(ctx: SeedContext): Promise<void> {
  logPhase('Clientes')
  const { payload, rng } = ctx

  const target = TARGETS.customers
  const existingSeed = await payload.find({
    collection: 'customers',
    where: { email: { contains: '@cliente-andina.demo' } },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  if (existingSeed.totalDocs >= target) {
    ctx.stats.customers = existingSeed.totalDocs
    logCount('Clientes (ya completos)', existingSeed.totalDocs)
    return
  }

  const startIndex = existingSeed.totalDocs

  for (let i = startIndex; i < target; i++) {
    const firstName = rng.pick(FIRST_NAMES)
    const lastName = rng.pick(LAST_NAMES)
    const isCompany = rng.int(0, 10) > 7
    const taxId = isCompany ? generateRuc(rng, 5000 + i) : generateDni(i + 1)
    const city = rng.pick(CITIES)
    const email = `cliente${i + 1}@cliente-andina.demo`

    await upsertByField({
      payload,
      collection: 'customers',
      field: 'email',
      value: email,
      data: {
        name: isCompany ? `${lastName} ${firstName} SAC` : `${firstName} ${lastName}`,
        taxId,
        address: `${rng.pick(STREETS)} ${rng.int(100, 999)}, ${city}`,
        phone: `+51 ${rng.int(900, 999)} ${rng.int(100, 999)} ${rng.int(100, 999)}`,
        email,
        contactName: `${firstName} ${lastName}`,
        active: rng.int(0, 20) > 1,
      },
    })
  }

  const clientUser = ctx.ids.users['cliente@distribuidora-andina.demo']
  if (clientUser) {
    const clientCustomer = await payload.find({
      collection: 'customers',
      where: { email: { equals: 'cliente1@cliente-andina.demo' } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (clientCustomer.docs[0]) {
      await payload.update({
        collection: 'customers',
        id: String(clientCustomer.docs[0].id),
        data: { linkedUser: clientUser.id },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'users',
        id: clientUser.id,
        data: { customerProfile: String(clientCustomer.docs[0].id) },
        overrideAccess: true,
      })
    }
  }

  ctx.stats.customers = await countDocs(payload, 'customers')
  logCount('Clientes', ctx.stats.customers)
}

export async function seedProducts(ctx: SeedContext): Promise<void> {
  logPhase('Productos')
  const { payload, rng } = ctx

  const target = TARGETS.products

  const existing = await payload.find({
    collection: 'products',
    where: { code: { contains: 'SD-PRD' } },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.totalDocs >= target) {
    ctx.stats.products = existing.totalDocs
    logCount('Productos (ya completos)', ctx.stats.products)
    return
  }

  const startIndex = existing.totalDocs

  const subcategoryDocs = await payload.find({
    collection: 'subcategories',
    where: { code: { contains: 'SD-SUB' } },
    limit: TARGETS.subcategories,
    depth: 0,
    overrideAccess: true,
  })

  const subcategoriesByCategory = new Map<string, string[]>()
  for (const sub of subcategoryDocs.docs) {
    const catId =
      typeof sub.category === 'object' && sub.category
        ? String(sub.category.id)
        : String(sub.category ?? '')
    const list = subcategoriesByCategory.get(catId) ?? []
    list.push(String(sub.id))
    subcategoriesByCategory.set(catId, list)
  }

  const brandIds = ctx.ids.brands
  const unitUnd = ctx.ids.units['UND']
  const unitKg = ctx.ids.units['KG']
  const unitLtr = ctx.ids.units['LTR']
  const unitPaq = ctx.ids.units['PAQ']

  const suppliers = await payload.find({
    collection: 'suppliers',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const supplierIds = suppliers.docs.map((s) => String(s.id))

  const placeholder = await payload.find({
    collection: 'media',
    where: { alt: { equals: 'Producto placeholder seed' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const imageId = placeholder.docs[0] ? String(placeholder.docs[0].id) : ctx.ids.media

  for (let i = startIndex; i < target; i++) {
    const catName = CATEGORY_NAMES[i % CATEGORY_NAMES.length]
    const categoryId = ctx.ids.categories[catName]
    const catSubs = subcategoriesByCategory.get(categoryId) ?? []
    const subcategoryId = catSubs.length ? catSubs[i % catSubs.length] : undefined
    const brandName = BRAND_NAMES[i % BRAND_NAMES.length]
    const brandId = brandIds[i % brandIds.length]
    const adj = rng.pick(PRODUCT_ADJECTIVES)
    const size = rng.pick(PRODUCT_SIZES)
    const subTemplate = (SUBCATEGORY_TEMPLATES[catName] ?? ['Producto'])[i % 5]

    const name = `${brandName} ${subTemplate} ${adj} ${size}`
    const code = padCode('PRD', i + 1, 5)
    const purchasePrice = rng.float(1.5, 120)
    const margin = rng.float(1.15, 1.65)
    const salePrice = Math.round(purchasePrice * margin * 100) / 100
    const minStock = rng.int(5, 30)
    const maxStock = minStock + rng.int(50, 500)

    const unitId =
      catName === 'Bebidas' || catName === 'Lácteos'
        ? unitLtr
        : catName === 'Carnes' || catName === 'Frutas' || catName === 'Verduras'
          ? unitKg
          : catName === 'Snacks' || catName === 'Papelería'
            ? unitPaq
            : unitUnd

    await upsertByField({
      payload,
      collection: 'products',
      field: 'code',
      value: code,
      data: {
        code,
        barcode: `775${String(1000000000 + i).slice(-10)}`,
        name,
        description: `${name}. Producto de demostración para categoría ${catName}.`,
        category: categoryId,
        ...(subcategoryId ? { subcategory: subcategoryId } : {}),
        brand: brandId,
        baseUnit: unitId,
        supplier: rng.pick(supplierIds),
        purchasePrice: Math.round(purchasePrice * 100) / 100,
        salePrice,
        taxRate: 18,
        minStockBase: minStock,
        maxStockBase: maxStock,
        weight: rng.float(0.1, 5),
        status: rng.int(0, 50) > 2 ? 'active' : 'inactive',
        active: rng.int(0, 50) > 2,
        trackInventory: true,
        image: imageId,
      },
    })

    if ((i + 1) % 100 === 0) {
      console.log(`  … ${i + 1}/${target} productos`)
    }
  }

  ctx.stats.products = await countDocs(payload, 'products')
  logCount('Productos', ctx.stats.products)
}
