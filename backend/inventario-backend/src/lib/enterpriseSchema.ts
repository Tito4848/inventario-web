export type MongoId = string

export interface RoleDoc {
  id: MongoId
  code: string
  name: string
  description?: string
  permissions: Record<string, boolean | Record<string, unknown>>
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface UserDoc {
  id: MongoId
  email: string
  password?: string
  fullName?: string
  phone?: string
  status: 'active' | 'inactive' | 'locked'
  roles: MongoId[]
  customerProfile?: MongoId
  supplierProfile?: MongoId
  employeeCode?: string
  locale?: string
  avatar?: MongoId
  lastLoginAt?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface CategoryDoc {
  id: MongoId
  code: string
  name: string
  slug: string
  parentCategory?: MongoId
  description?: string
  isActive: boolean
  sortOrder: number
  image?: MongoId
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface SubcategoryDoc {
  id: MongoId
  code: string
  name: string
  slug: string
  category: MongoId
  description?: string
  isActive: boolean
  sortOrder: number
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface UnitDoc {
  id: MongoId
  code: string
  name: string
  symbol: string
  isBaseUnit: boolean
  factorToBase: number
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface UnitEquivalenceDoc {
  id: MongoId
  fromUnit: MongoId
  toUnit: MongoId
  factor: number
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface SupplierDoc {
  id: MongoId
  code: string
  businessName: string
  taxId: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  paymentTermsDays?: number
  currency?: string
  creditLimit?: number
  active: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface CustomerDoc {
  id: MongoId
  code: string
  name: string
  type: 'person' | 'company'
  taxId?: string
  email?: string
  phone?: string
  address?: string
  creditLimit?: number
  defaultCurrency?: string
  linkedUser?: MongoId
  active: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface WarehouseDoc {
  id: MongoId
  code: string
  name: string
  address?: string
  manager?: MongoId
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface SectionDoc {
  id: MongoId
  code: string
  name: string
  warehouse: MongoId
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface RackDoc {
  id: MongoId
  code: string
  name: string
  warehouse: MongoId
  section?: MongoId
  isActive: boolean
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface ProductDoc {
  id: MongoId
  code: string
  barcode?: string
  sku?: string
  name: string
  slug?: string
  category?: MongoId
  subcategory?: MongoId
  baseUnit: MongoId
  purchaseUnit?: MongoId
  saleUnit?: MongoId
  supplier?: MongoId
  brand?: string
  purchasePrice?: number
  salePrice?: number
  taxRate?: number
  minStockBase: number
  maxStockBase?: number
  status: 'active' | 'inactive' | 'discontinued'
  active: boolean
  trackInventory: boolean
  allowNegativeStock: boolean
  image?: MongoId
  description?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface StockLevelDoc {
  id: MongoId
  label: string
  product: MongoId
  rack: MongoId
  quantityBase: number
  reservedQtyBase: number
  availableQtyBase: number
  value: number
  lastMovementAt?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface StockLotDoc {
  id: MongoId
  code?: string
  label: string
  product: MongoId
  rack: MongoId
  receivedAt: string
  initialQtyBase: number
  qtyRemainingBase: number
  unitCostBase: number
  expiryAt?: string
  supplier?: MongoId
  sourceMovement?: MongoId
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface StockMovementDoc {
  id: MongoId
  label: string
  movementType: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjust_in' | 'adjust_out' | 'return_in' | 'return_out'
  referenceType?: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return'
  referenceId?: MongoId
  date: string
  product: MongoId
  rack: MongoId
  quantity: number
  unit: MongoId
  quantityBase: number
  unitCostBase?: number
  totalValue?: number
  notes?: string
  fifoAllocations?: Array<{
    lot: MongoId
    qtyBase: number
    unitCostBase: number
    value: number
  }>
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface KardexEntryDoc {
  id: MongoId
  product: MongoId
  rack: MongoId
  movement: MongoId
  lot?: MongoId
  entryType: 'in' | 'out'
  quantityBase: number
  unitCostBase: number
  value: number
  balanceQtyBase: number
  balanceValue: number
  occurredAt: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderDoc {
  id: MongoId
  orderNumber: string
  supplier: MongoId
  warehouse: MongoId
  status: 'draft' | 'sent' | 'partial' | 'received' | 'invoiced' | 'cancelled'
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  invoiceNumber?: string
  items: Array<{
    product: MongoId
    quantity: number
    unit: MongoId
    unitCost: number
    taxRate?: number
    lineTotal: number
  }>
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface SalesOrderDoc {
  id: MongoId
  orderNumber: string
  customer: MongoId
  warehouse: MongoId
  status: 'draft' | 'confirmed' | 'packed' | 'delivered' | 'cancelled'
  saleDate: string
  deliveryDate?: string
  items: Array<{
    product: MongoId
    quantity: number
    unit: MongoId
    unitPrice: number
    discountPercent?: number
    lineTotal: number
  }>
  subtotal: number
  discountAmount: number
  tax: number
  total: number
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded'
  notes?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface ReturnDoc {
  id: MongoId
  type: 'purchase' | 'sale'
  referenceType: 'purchase-order' | 'sales-order'
  referenceId: MongoId
  reason: string
  status: 'requested' | 'approved' | 'rejected' | 'processed'
  items: Array<{
    product: MongoId
    quantity: number
    unit: MongoId
    unitCost?: number
    unitPrice?: number
    lineTotal: number
  }>
  total: number
  createdBy?: MongoId
  approvedBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface AuditLogDoc {
  id: MongoId
  user?: MongoId
  action: string
  module: string
  resourceType?: string
  resourceId?: MongoId
  details?: Record<string, unknown>
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface NotificationDoc {
  id: MongoId
  recipient: MongoId
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high'
  isRead: boolean
  entityType?: string
  entityId?: MongoId
  metadata?: Record<string, unknown>
  expiresAt?: string
  createdBy?: MongoId
  createdAt: string
  updatedAt: string
}

export interface SettingsDoc {
  id: MongoId
  key: string
  value: Record<string, unknown> | string | number | boolean | null
  scope: 'global' | 'warehouse' | 'role' | 'user'
  scopeId?: MongoId
  description?: string
  updatedBy?: MongoId
  createdAt: string
  updatedAt: string
}

export const enterpriseMongoCollections = [
  {
    slug: 'roles',
    purpose: 'Definir permisos y accesos por rol empresarial.',
    relationships: ['users.roles -> roles.id (many-to-many)'],
    indexes: ['{ code: 1 } unique', '{ name: 1 } unique'],
    validations: ['code obligatorio y único', 'permissions debe ser un objeto JSON válido'],
  },
  {
    slug: 'users',
    purpose: 'Autenticación y perfiles de usuarios del sistema.',
    relationships: ['users.roles -> roles.id', 'users.customerProfile -> customers.id', 'users.supplierProfile -> suppliers.id', 'users.createdBy -> users.id'],
    indexes: ['{ email: 1 } unique', '{ status: 1 }', '{ createdAt: -1 }'],
    validations: ['email debe ser único y válido', 'status debe ser active|inactive|locked', 'roles no puede estar vacío'],
  },
  {
    slug: 'categories',
    purpose: 'Clasificación jerárquica de productos.',
    relationships: ['categories.parentCategory -> categories.id', 'products.category -> categories.id', 'subcategories.category -> categories.id'],
    indexes: ['{ slug: 1, parentCategory: 1 } unique', '{ isActive: 1 }', '{ sortOrder: 1 }'],
    validations: ['name obligatorio', 'slug obligatorio y único por padre', 'parentCategory no puede apuntar a sí mismo'],
  },
  {
    slug: 'subcategories',
    purpose: 'Subclasificación de categorías.',
    relationships: ['subcategories.category -> categories.id', 'products.subcategory -> subcategories.id'],
    indexes: ['{ category: 1, slug: 1 } unique', '{ isActive: 1 }'],
    validations: ['name obligatorio', 'category obligatorio'],
  },
  {
    slug: 'units',
    purpose: 'Unidades de medida y equivalencias base.',
    relationships: ['products.baseUnit -> units.id', 'products.purchaseUnit -> units.id', 'products.saleUnit -> units.id', 'unit-equivalences.fromUnit -> units.id', 'unit-equivalences.toUnit -> units.id'],
    indexes: ['{ code: 1 } unique', '{ isBaseUnit: 1 }'],
    validations: ['code obligatorio y único', 'factorToBase > 0 si no es unidad base'],
  },
  {
    slug: 'unit-equivalences',
    purpose: 'Reglas de conversión entre unidades.',
    relationships: ['unit-equivalences.fromUnit -> units.id', 'unit-equivalences.toUnit -> units.id'],
    indexes: ['{ fromUnit: 1, toUnit: 1 } unique', '{ isActive: 1 }'],
    validations: ['factor > 0', 'fromUnit y toUnit no pueden ser iguales'],
  },
  {
    slug: 'suppliers',
    purpose: 'Proveedores de compra.',
    relationships: ['products.supplier -> suppliers.id', 'purchase-orders.supplier -> suppliers.id', 'stock-lots.supplier -> suppliers.id'],
    indexes: ['{ taxId: 1 } unique', '{ businessName: 1 }', '{ active: 1 }'],
    validations: ['businessName y taxId obligatorios', 'email debe ser válido si existe', 'creditLimit >= 0'],
  },
  {
    slug: 'customers',
    purpose: 'Clientes de ventas y portal.',
    relationships: ['sales-orders.customer -> customers.id', 'users.customerProfile -> customers.id'],
    indexes: ['{ taxId: 1 } unique', '{ email: 1 }', '{ active: 1 }'],
    validations: ['name obligatorio', 'taxId único si se proporciona', 'linkedUser debe ser un usuario con rol cliente'],
  },
  {
    slug: 'warehouses',
    purpose: 'Depósitos o almacenes físicos.',
    relationships: ['sections.warehouse -> warehouses.id', 'racks.warehouse -> warehouses.id', 'purchase-orders.warehouse -> warehouses.id', 'sales-orders.warehouse -> warehouses.id'],
    indexes: ['{ code: 1 } unique', '{ isActive: 1 }'],
    validations: ['code obligatorio y único', 'name obligatorio'],
  },
  {
    slug: 'sections',
    purpose: 'Secciones dentro de un almacén.',
    relationships: ['sections.warehouse -> warehouses.id', 'racks.section -> sections.id'],
    indexes: ['{ warehouse: 1, code: 1 } unique'],
    validations: ['warehouse obligatorio', 'code obligatorio'],
  },
  {
    slug: 'racks',
    purpose: 'Ubicaciones físicas para stock.',
    relationships: ['stock-levels.rack -> racks.id', 'stock-lots.rack -> racks.id', 'stock-movements.rack -> racks.id', 'kardex-entries.rack -> racks.id'],
    indexes: ['{ warehouse: 1, code: 1 } unique', '{ isActive: 1 }'],
    validations: ['warehouse obligatorio', 'code obligatorio'],
  },
  {
    slug: 'products',
    purpose: 'Catálogo maestro de productos.',
    relationships: ['products.category -> categories.id', 'products.subcategory -> subcategories.id', 'products.baseUnit -> units.id', 'products.supplier -> suppliers.id', 'stock-levels.product -> products.id', 'stock-lots.product -> products.id', 'stock-movements.product -> products.id', 'kardex-entries.product -> products.id'],
    indexes: ['{ code: 1 } unique', '{ barcode: 1 } unique', '{ name: 1 }', '{ active: 1, status: 1 }'],
    validations: ['code obligatorio y único', 'name obligatorio', 'baseUnit obligatorio', 'salePrice >= 0', 'purchasePrice >= 0'],
  },
  {
    slug: 'stock-levels',
    purpose: 'Saldo actual por producto y rack.',
    relationships: ['stock-levels.product -> products.id', 'stock-levels.rack -> racks.id'],
    indexes: ['{ product: 1, rack: 1 } unique', '{ availableQtyBase: 1 }'],
    validations: ['quantityBase >= 0', 'reservedQtyBase <= quantityBase'],
  },
  {
    slug: 'stock-lots',
    purpose: 'Lotes de inventario para trazabilidad FIFO.',
    relationships: ['stock-lots.product -> products.id', 'stock-lots.rack -> racks.id', 'kardex-entries.lot -> stock-lots.id'],
    indexes: ['{ product: 1, rack: 1, receivedAt: 1 }', '{ qtyRemainingBase: 1 }'],
    validations: ['initialQtyBase > 0', 'qtyRemainingBase >= 0', 'unitCostBase >= 0'],
  },
  {
    slug: 'stock-movements',
    purpose: 'Libro de movimientos de inventario.',
    relationships: ['stock-movements.product -> products.id', 'stock-movements.rack -> racks.id', 'stock-movements.unit -> units.id', 'stock-movements.createdBy -> users.id', 'kardex-entries.movement -> stock-movements.id'],
    indexes: ['{ date: -1 }', '{ product: 1, rack: 1, date: -1 }', '{ movementType: 1 }', '{ referenceType: 1, referenceId: 1 }'],
    validations: ['quantity > 0', 'quantityBase > 0', 'out movements deben tener stock suficiente'],
  },
  {
    slug: 'kardex-entries',
    purpose: 'Movimientos materializados para consulta y reportes FIFO.',
    relationships: ['kardex-entries.product -> products.id', 'kardex-entries.rack -> racks.id', 'kardex-entries.movement -> stock-movements.id', 'kardex-entries.lot -> stock-lots.id'],
    indexes: ['{ product: 1, rack: 1, occurredAt: -1 }', '{ movement: 1 }'],
    validations: ['quantityBase > 0', 'balanceQtyBase >= 0'],
  },
  {
    slug: 'purchase-orders',
    purpose: 'Órdenes de compra y recepción.',
    relationships: ['purchase-orders.supplier -> suppliers.id', 'purchase-orders.warehouse -> warehouses.id', 'purchase-orders.createdBy -> users.id'],
    indexes: ['{ orderNumber: 1 } unique', '{ supplier: 1, status: 1 }', '{ orderDate: -1 }'],
    validations: ['orderNumber obligatorio y único', 'items no puede estar vacío', 'total >= 0'],
  },
  {
    slug: 'sales-orders',
    purpose: 'Órdenes de venta y despacho.',
    relationships: ['sales-orders.customer -> customers.id', 'sales-orders.warehouse -> warehouses.id', 'sales-orders.createdBy -> users.id'],
    indexes: ['{ orderNumber: 1 } unique', '{ customer: 1, status: 1 }', '{ saleDate: -1 }'],
    validations: ['orderNumber obligatorio y único', 'items no puede estar vacío', 'total >= 0'],
  },
  {
    slug: 'returns',
    purpose: 'Devoluciones de compras y ventas.',
    relationships: ['returns.referenceId -> purchase-orders.id o sales-orders.id', 'returns.createdBy -> users.id', 'returns.approvedBy -> users.id'],
    indexes: ['{ referenceType: 1, referenceId: 1 }', '{ status: 1 }'],
    validations: ['type obligatorio', 'items no puede estar vacío', 'total >= 0'],
  },
  {
    slug: 'audit-logs',
    purpose: 'Trazabilidad de acciones del sistema.',
    relationships: ['audit-logs.user -> users.id'],
    indexes: ['{ resourceType: 1, resourceId: 1 }', '{ user: 1, createdAt: -1 }', '{ createdAt: -1 }'],
    validations: ['action y module obligatorios'],
  },
  {
    slug: 'notifications',
    purpose: 'Alertas y tareas para usuarios.',
    relationships: ['notifications.recipient -> users.id', 'notifications.createdBy -> users.id'],
    indexes: ['{ recipient: 1, isRead: 1, createdAt: -1 }', '{ expiresAt: 1 }'],
    validations: ['title y message obligatorios', 'priority debe ser low|medium|high'],
  },
  {
    slug: 'settings',
    purpose: 'Configuración global o por alcance.',
    relationships: ['settings.updatedBy -> users.id'],
    indexes: ['{ key: 1, scope: 1, scopeId: 1 } unique'],
    validations: ['key obligatorio', 'scope obligatorio'],
  },
] as const

export const schemaRelationshipMap = {
  users: ['roles', 'customers', 'suppliers', 'warehouses'],
  products: ['categories', 'subcategories', 'units', 'suppliers', 'stock-levels', 'stock-lots', 'stock-movements', 'kardex-entries'],
  stockMovements: ['products', 'racks', 'units', 'users', 'stock-lots'],
  purchaseOrders: ['suppliers', 'warehouses', 'users'],
  salesOrders: ['customers', 'warehouses', 'users'],
  returns: ['purchase-orders', 'sales-orders', 'users'],
  auditLogs: ['users'],
  notifications: ['users'],
  settings: ['users'],
} as const
