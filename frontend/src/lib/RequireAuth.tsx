import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import PageSkeleton from '../components/ui/PageSkeleton'
import { canAccessModule, getDefaultRoute, isInvitadoOnly, type AppModule } from './permissions'

const pathModules: Record<string, AppModule> = {
  '/app': 'dashboard',
  '/app/analytics': 'analytics',
  '/app/notificaciones': 'notifications',
  '/app/productos': 'products',
  '/app/categorias': 'categories',
  '/app/subcategorias': 'categories',
  '/app/unidades': 'products',
  '/app/equivalencias': 'products',
  '/app/proveedores': 'suppliers',
  '/app/clientes': 'customers',
  '/app/compras': 'purchases',
  '/app/ventas': 'sales',
  '/app/stock': 'stock',
  '/app/movimientos': 'movements',
  '/app/kardex': 'kardex',
  '/app/reportes': 'reports',
  '/app/auditoria': 'audit',
  '/app/configuracion': 'settings',
  '/app/portal': 'portal',
  '/app/usuarios': 'users',
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, permissions, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSkeleton />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  if (isInvitadoOnly(user.roles)) {
    return <Navigate to="/login" replace />
  }

  const module = pathModules[location.pathname]
  if (module && !canAccessModule(user, module, permissions)) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  return <>{children}</>
}

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, permissions, loading } = useAuth()
  if (loading) return <PageSkeleton />
  if (user) return <Navigate to={getDefaultRoute(permissions, user.roles)} replace />
  return <>{children}</>
}
