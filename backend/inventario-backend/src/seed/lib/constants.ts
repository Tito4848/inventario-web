export const SEED_VERSION = '1.0.0'
export const SEED_MARKER = 'seed:v1'
export const SEED_CODE_PREFIX = 'SD'

export const TARGETS = {
  categories: 25,
  subcategories: 100,
  brands: 80,
  unitEquivalences: 10,
  suppliers: 100,
  customers: 400,
  products: 1000,
  racks: 60,
  purchaseOrders: 250,
  salesOrders: 700,
  historicalMovements: 600,
  promotions: 30,
  notifications: 25,
  auditLogs: 80,
} as const

export const SEED_PASSWORD = 'Demo2024!'

export const DEMO_USERS = [
  {
    email: 'admin@distribuidora-andina.demo',
    fullName: 'Carlos Mendoza Ruiz',
    roles: ['admin'] as const,
    firstName: 'Carlos',
    lastName: 'Mendoza',
  },
  {
    email: 'supervisor@distribuidora-andina.demo',
    fullName: 'María Torres Vega',
    roles: ['supervisor'] as const,
    firstName: 'María',
    lastName: 'Torres',
  },
  {
    email: 'operador@distribuidora-andina.demo',
    fullName: 'Luis Ramírez Castro',
    roles: ['operator'] as const,
    firstName: 'Luis',
    lastName: 'Ramírez',
  },
  {
    email: 'almacenero@distribuidora-andina.demo',
    fullName: 'Pedro Quispe Huamán',
    roles: ['warehouse'] as const,
    firstName: 'Pedro',
    lastName: 'Quispe',
  },
  {
    email: 'vendedor@distribuidora-andina.demo',
    fullName: 'Ana Flores Díaz',
    roles: ['seller'] as const,
    firstName: 'Ana',
    lastName: 'Flores',
  },
  {
    email: 'cliente@distribuidora-andina.demo',
    fullName: 'Jorge Paredes Luna',
    roles: ['client'] as const,
    firstName: 'Jorge',
    lastName: 'Paredes',
  },
] as const

export const WAREHOUSES = [
  { code: 'WH-MAIN', name: 'Almacén Principal', address: 'Av. Industrial 1250, Lima' },
  { code: 'WH-SEC', name: 'Almacén Secundario', address: 'Carretera Central Km 18, Ate' },
  { code: 'WH-STORE', name: 'Tienda', address: 'Jr. Comercio 340, Miraflores' },
  { code: 'WH-RET', name: 'Devoluciones', address: 'Av. Argentina 890, Callao' },
] as const

export const RACK_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export const RACKS_PER_SECTION = 10
