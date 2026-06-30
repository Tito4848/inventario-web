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

export type InventoryRole =
  | 'admin'
  | 'supervisor'
  | 'warehouse'
  | 'client'
  | 'invitado'

/** @deprecated Conservados para usuarios existentes */
export type LegacyRole = 'guest' | 'seller' | 'operator' | 'viewer'

export type UserRole = InventoryRole | LegacyRole

export type UserPermissions = {
  modules: AppModule[]
  defaultRoute: string
  canReadInventory: boolean
  canAccessAnalytics: boolean
  canViewUsers?: boolean
  canManageUsers?: boolean
  canDeleteUsers?: boolean
  canEditUsers?: boolean
  canResetPasswords?: boolean
  canEditOperationalUsers?: boolean
  canViewProducts?: boolean
  canCreateProducts?: boolean
  canEditProducts?: boolean
  canDeleteProducts?: boolean
  canReadPurchases?: boolean
  canCreatePurchases?: boolean
  canUpdatePurchases?: boolean
  canDeletePurchases?: boolean
  canReceivePurchases?: boolean
  canReportPurchases?: boolean
  canReadSales?: boolean
  canCreateSales?: boolean
  canUpdateSales?: boolean
  canDeleteSales?: boolean
  canConfirmSales?: boolean
  canDeliverSales?: boolean
  canCancelSales?: boolean
  canReturnSales?: boolean
  canReportSales?: boolean
}

export type SalesPermissions = {
  canReadSales: boolean
  canCreateSales: boolean
  canUpdateSales: boolean
  canDeleteSales: boolean
  canConfirmSales: boolean
  canDeliverSales: boolean
  canCancelSales: boolean
  canReturnSales: boolean
  canReportSales: boolean
}

/** Deriva permisos de ventas desde la API o roles (espejo de salesAccess.ts) */
export function resolveSalesPermissions(
  user: { roles?: string[] } | null | undefined,
  permissions?: UserPermissions | null,
): SalesPermissions {
  const isAdminUser = userHasRole(user, 'admin')
  const canCreate =
    isAdminUser ||
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'seller')
  const canWarehouseAction =
    isAdminUser ||
    userHasRole(user, 'supervisor') ||
    userHasRole(user, 'operator') ||
    userHasRole(user, 'warehouse')
  const canReturn =
    isAdminUser || userHasRole(user, 'supervisor') || userHasRole(user, 'warehouse')

  return {
    canReadSales: Boolean(
      permissions?.canReadSales ?? canAccessModule(user, 'sales', permissions),
    ),
    canCreateSales: Boolean(permissions?.canCreateSales ?? canCreate),
    canUpdateSales: Boolean(permissions?.canUpdateSales ?? canCreate),
    canDeleteSales: Boolean(permissions?.canDeleteSales ?? isAdminUser),
    canConfirmSales: Boolean(permissions?.canConfirmSales ?? canWarehouseAction),
    canDeliverSales: Boolean(permissions?.canDeliverSales ?? canWarehouseAction),
    canCancelSales: Boolean(permissions?.canCancelSales ?? canCreate),
    canReturnSales: Boolean(permissions?.canReturnSales ?? canReturn),
    canReportSales: Boolean(
      permissions?.canReportSales ??
        (canAccessModule(user, 'sales', permissions) ||
          canAccessModule(user, 'reports', permissions)),
    ),
  }
}

const LEGACY_ROLE_ALIASES: Partial<Record<LegacyRole, InventoryRole[]>> = {
  guest: ['client'],
  viewer: ['invitado'],
}

const APP_ACCESS_ROLES = [
  'admin',
  'supervisor',
  'warehouse',
  'client',
  'guest',
  'seller',
  'operator',
  'viewer',
] as const

const moduleRoles: Record<AppModule, UserRole[]> = {
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

function userHasRole(user: { roles?: string[] } | null | undefined, role: UserRole): boolean {
  const roles = user?.roles ?? []
  if (roles.includes(role)) return true

  for (const assigned of roles) {
    const aliases = LEGACY_ROLE_ALIASES[assigned as LegacyRole]
    if (aliases?.includes(role as InventoryRole)) return true
  }

  return false
}

export function isAdmin(user: { roles?: string[] } | null | undefined): boolean {
  return userHasRole(user, 'admin')
}

export function isInvitadoOnly(roles?: string[] | null): boolean {
  if (!roles?.length) return false
  const hasAppRole = roles.some((r) => (APP_ACCESS_ROLES as readonly string[]).includes(r))
  return roles.includes('invitado') && !hasAppRole
}

export function canAccessModule(
  user: { roles?: string[] } | null | undefined,
  module: AppModule,
  permissions?: UserPermissions | null,
): boolean {
  if (permissions?.modules) return permissions.modules.includes(module)
  if (!user) return false
  if (isAdmin(user)) return true
  return (moduleRoles[module] || []).some((role) => userHasRole(user, role))
}

export function getDefaultRoute(permissions?: UserPermissions | null, roles?: string[]): string {
  if (isInvitadoOnly(roles)) return '/'

  if (permissions?.defaultRoute) {
    if (
      permissions.defaultRoute === '/app' &&
      roles?.includes('seller') &&
      !roles.includes('admin')
    ) {
      return '/app/ventas'
    }
    return permissions.defaultRoute
  }
  return '/app'
}

export const navConfig: Array<{
  label: string
  items: Array<{ to: string; label: string; module: AppModule; end?: boolean }>
}> = [
  {
    label: 'General',
    items: [
      { to: '/app', label: 'Dashboard', module: 'dashboard', end: true },
      { to: '/app/portal', label: 'Mi portal', module: 'portal', end: true },
      { to: '/app/analytics', label: 'Analítica', module: 'analytics' },
      { to: '/app/notificaciones', label: 'Notificaciones', module: 'notifications' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/app/productos', label: 'Productos', module: 'products' },
      { to: '/app/categorias', label: 'Categorías', module: 'categories' },
      { to: '/app/subcategorias', label: 'Subcategorías', module: 'categories' },
      { to: '/app/marcas', label: 'Marcas', module: 'categories' },
      { to: '/app/unidades', label: 'Unidades', module: 'products' },
      { to: '/app/equivalencias', label: 'Equivalencias', module: 'products' },
      { to: '/app/racks', label: 'Racks', module: 'stock' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/app/proveedores', label: 'Proveedores', module: 'suppliers' },
      { to: '/app/clientes', label: 'Clientes', module: 'customers' },
      { to: '/app/compras', label: 'Compras', module: 'purchases' },
      { to: '/app/ventas', label: 'Ventas', module: 'sales' },
      { to: '/app/stock', label: 'Stock', module: 'stock' },
      { to: '/app/movimientos', label: 'Movimientos', module: 'movements' },
      { to: '/app/kardex', label: 'Kardex FIFO', module: 'kardex' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/app/usuarios', label: 'Usuarios', module: 'users' },
      { to: '/app/reportes', label: 'Reportes', module: 'reports' },
      { to: '/app/auditoria', label: 'Auditoría', module: 'audit' },
      { to: '/app/configuracion', label: 'Configuración', module: 'settings' },
    ],
  },
]

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'warehouse', label: 'Almacenero' },
  { value: 'client', label: 'Cliente' },
  { value: 'invitado', label: 'Invitado' },
] as const

export const CRITICAL_ROLES = ['admin', 'supervisor'] as const

export function isOperationalUser(roles: string[]): boolean {
  if (!roles.length) return false
  if (roles.some((r) => (CRITICAL_ROLES as readonly string[]).includes(r))) return false
  return true
}
