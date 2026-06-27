import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { fetchCollection } from '../lib/api'
import PageSkeleton from '../components/ui/PageSkeleton'
import EmptyState from '../components/ui/EmptyState'
import GenericDataTable from '../components/table/GenericDataTable'
import { useAuth } from '../lib/AuthProvider'
import { canAccessModule, getDefaultRoute } from '../lib/permissions'

export default function PortalCliente() {
  const { user, permissions } = useAuth()

  const canAccessPortal = permissions
    ? canAccessModule(user, 'portal', permissions)
    : null

  const { data, isLoading } = useQuery({
    queryKey: ['my-sales-orders'],
    queryFn: () =>
      fetchCollection<Record<string, unknown>>('sales-orders', { limit: 50, sort: '-saleDate' }),
    enabled: canAccessPortal === true,
  })

  if (canAccessPortal === false) {
    return <Navigate to={getDefaultRoute(permissions, user?.roles)} replace />
  }

  if (canAccessPortal === null || isLoading) return <PageSkeleton />

  const rows = data?.docs || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi portal</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hola{user?.fullName ? `, ${user.fullName}` : ''}. Aquí ves solo tus operaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <div className="text-sm text-slate-500">Mis pedidos</div>
          <div className="mt-2 text-3xl font-bold">{data?.totalDocs ?? 0}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin operaciones"
          description="Cuando registres compras o ventas vinculadas a tu cuenta, aparecerán aquí."
        />
      ) : (
        <GenericDataTable
          columns={[
            { key: 'orderNumber', label: 'N° Venta' },
            { key: 'saleDate', label: 'Fecha' },
            { key: 'status', label: 'Estado' },
            { key: 'total', label: 'Total' },
          ]}
          data={rows}
        />
      )}
    </div>
  )
}
