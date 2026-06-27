/**
 * Matriz canónica RBAC — fuente única de verdad para roles y módulos.
 * Roles activos: admin, supervisor, warehouse, client, invitado.
 * Códigos legacy (guest, seller, operator, viewer) se mantienen en BD sin migración.
 */

export type InventoryRole =
  | 'admin'
  | 'supervisor'
  | 'warehouse'
  | 'client'
  | 'invitado'

/** @deprecated Roles heredados; conservados para usuarios existentes en MongoDB */
export type LegacyRole = 'guest' | 'seller' | 'operator' | 'viewer'

export type UserRole = InventoryRole | LegacyRole

export type AppModule =
  | 'dashboard'
  | 'analytics'
  | 'notifications'
  | 'products'
  | 'categories'
  | 'suppliers'
  | 'customers'
  | 'purchases'
  | 'sales'
  | 'stock'
  | 'movements'
  | 'kardex'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'users'
  | 'portal'

/** Rutas públicas (sin panel /app) — accesibles sin RBAC administrativo */
export type PublicModule = 'landing' | 'publicCatalog' | 'publicSearch' | 'publicPromotions'

export const INVENTORY_ROLES: InventoryRole[] = [
  'admin',
  'supervisor',
  'warehouse',
  'client',
  'invitado',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  warehouse: 'Almacenero',
  client: 'Cliente',
  invitado: 'Invitado',
  guest: 'Cliente',
  seller: 'Vendedor',
  operator: 'Operador',
  viewer: 'Consulta',
}

/** Prioridad para resolver el rol principal cuando un usuario tiene varios */
export const ROLE_PRIORITY: UserRole[] = [
  'admin',
  'supervisor',
  'warehouse',
  'client',
  'guest',
  'seller',
  'operator',
  'viewer',
  'invitado',
]

/** Alias legacy → roles canónicos (solo renombres directos, sin ampliar permisos) */
export const LEGACY_ROLE_ALIASES: Partial<Record<LegacyRole, InventoryRole[]>> = {
  guest: ['client'],
  viewer: ['invitado'],
}

export const moduleRoles: Record<AppModule, UserRole[]> = {
  dashboard: ['admin', 'supervisor', 'warehouse', 'operator', 'viewer', 'seller'],
  analytics: ['admin', 'supervisor'],
  notifications: [
    'admin',
    'supervisor',
    'warehouse',
    'client',
    'guest',
    'operator',
    'viewer',
    'seller',
  ],
  products: ['admin', 'supervisor', 'warehouse', 'operator', 'viewer'],
  categories: ['admin', 'supervisor', 'operator'],
  suppliers: ['admin', 'supervisor', 'operator'],
  customers: ['admin', 'supervisor', 'client', 'guest', 'seller', 'operator'],
  purchases: ['admin', 'supervisor', 'operator'],
  sales: ['admin', 'supervisor', 'client', 'guest', 'seller', 'operator'],
  stock: ['admin', 'supervisor', 'warehouse', 'operator', 'viewer'],
  movements: ['admin', 'supervisor', 'warehouse', 'operator'],
  kardex: ['admin', 'supervisor', 'warehouse', 'operator', 'viewer'],
  reports: ['admin', 'supervisor', 'operator', 'viewer'],
  audit: ['admin', 'supervisor'],
  settings: [
    'admin',
    'supervisor',
    'warehouse',
    'client',
    'guest',
    'operator',
    'viewer',
    'seller',
  ],
  users: ['admin', 'supervisor', 'warehouse'],
  portal: ['client', 'guest'],
}

/** Lectura de colecciones de inventario (Payload access) */
export const inventoryReadRoles: UserRole[] = [
  'admin',
  'supervisor',
  'warehouse',
  'operator',
  'viewer',
]

/** Escritura de colecciones de inventario (Payload access) */
export const inventoryWriteRoles: UserRole[] = ['admin', 'supervisor', 'warehouse', 'operator']

export function isLegacyRole(role: string): role is LegacyRole {
  return role === 'guest' || role === 'seller' || role === 'operator' || role === 'viewer'
}

export function getRoleLabel(role: UserRole | string): string {
  return ROLE_LABELS[role as UserRole] ?? role
}
