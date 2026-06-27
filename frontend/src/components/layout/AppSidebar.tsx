import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Box,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { useAuth } from '../../lib/AuthProvider'
import { useNotifications } from '../../lib/notifications'
import { canAccessModule, navConfig } from '../../lib/permissions'
import ThemeToggle from '../ui/ThemeToggle'

const iconMap = {
  Dashboard: LayoutDashboard,
  'Mi portal': UserCircle,
  Analítica: BarChart3,
  Notificaciones: Bell,
  Productos: Package,
  Categorías: Box,
  Subcategorías: Box,
  Unidades: Box,
  Equivalencias: Box,
  Proveedores: Truck,
  Clientes: Users,
  Compras: ShoppingCart,
  Ventas: ShoppingBag,
  Stock: Warehouse,
  Movimientos: Warehouse,
  'Kardex FIFO': FileText,
  Reportes: FileText,
  Auditoría: Building2,
  Configuración: Settings,
  Usuarios: Users,
} as const

export default function AppSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { user, permissions, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()

  const visibleGroups = navConfig
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.module === 'portal' && canAccessModule(user, 'dashboard', permissions)) return false
        return canAccessModule(user, item.module, permissions)
      }),
    }))
    .filter((group) => group.items.length > 0)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-5">
        <div>
          <div className="text-lg font-bold gradient-text">Inventario Pro</div>
          <div className="text-xs text-slate-500">Panel empresarial</div>
        </div>
        <button type="button" className="md:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = iconMap[item.label as keyof typeof iconMap] || Package
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.to === '/app/notificaciones' && unreadCount > 0 && (
                        <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-surface-border p-4">
        <div className="mb-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800/80">
          <div className="truncate text-sm font-medium">{user?.fullName || user?.email}</div>
          <div className="truncate text-xs text-slate-500">{user?.roles?.join(', ') || 'Usuario'}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-red-600 dark:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-surface-border bg-surface-elevated md:block">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-elevated shadow-glass">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}

export function AppTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { unreadCount } = useNotifications()
  const { permissions } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-surface-border bg-surface/80 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-lg p-2 md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden text-sm text-slate-500 md:block">
          {permissions?.canReadInventory ? 'Panel de operaciones' : 'Mi área personal'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {canAccessModule(null, 'notifications', permissions) && (
          <NavLink
            to="/app/notificaciones"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-surface-elevated"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        )}
      </div>
    </header>
  )
}
