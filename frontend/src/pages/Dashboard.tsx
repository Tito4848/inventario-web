import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  DollarSign,
  Package,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
  XCircle,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import { fetchDashboardStats } from '../lib/api'
import PageSkeleton from '../components/ui/PageSkeleton'
import ErrorState from '../components/ui/ErrorState'
import { useAuth } from '../lib/AuthProvider'
import { getDefaultRoute } from '../lib/permissions'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

export default function Dashboard() {
  const { permissions, user } = useAuth()

  if (permissions && !permissions.canReadInventory) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="No se pudieron cargar las métricas." onRetry={() => refetch()} />

  const stats = data!

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard ejecutivo</h1>
        <p className="mt-1 text-sm text-slate-500">Vista general de tu operación en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total productos" value={stats.totalProducts} icon={Package} />
        <StatCard title="Total categorías" value={stats.totalCategories} icon={Box} />
        <StatCard title="Total proveedores" value={stats.totalSuppliers} icon={ShoppingCart} />
        {permissions?.canManageUsers && (
          <StatCard title="Total usuarios" value={stats.totalUsers} icon={Users} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total movimientos" value={stats.totalMovements} icon={TrendingUp} />
        <StatCard title="Stock bajo" value={stats.lowStock} icon={AlertTriangle} trend="down" />
        <StatCard title="Sin stock" value={stats.outOfStock} icon={XCircle} trend="down" />
        <StatCard title="Valor inventario" value={formatCurrency(stats.inventoryValue)} icon={Warehouse} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Entradas hoy" value={stats.dailyEntries} icon={ArrowDownCircle} />
        <StatCard title="Salidas hoy" value={stats.dailyExits} icon={ArrowUpCircle} />
        <StatCard
          title="Cant. entradas hoy"
          value={stats.dailyEntriesQty.toFixed(2)}
          icon={ArrowDownCircle}
        />
        <StatCard
          title="Cant. salidas hoy"
          value={stats.dailyExitsQty.toFixed(2)}
          icon={ArrowUpCircle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard title="Ventas del mes" value={formatCurrency(stats.monthlySales)} icon={ShoppingBag} />
        <StatCard title="Compras del mes" value={formatCurrency(stats.monthlyPurchases)} icon={DollarSign} />
      </div>
    </div>
  )
}
