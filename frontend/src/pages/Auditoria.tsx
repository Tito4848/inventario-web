import { useQuery } from '@tanstack/react-query'
import { fetchCollection } from '../lib/api'
import PageSkeleton from '../components/ui/PageSkeleton'
import GenericDataTable from '../components/table/GenericDataTable'
import EmptyState from '../components/ui/EmptyState'

export default function Auditoria() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchCollection<Record<string, unknown>>('audit-logs', { limit: 50, sort: '-createdAt' }),
  })

  if (isLoading) return <PageSkeleton />

  const rows = data?.docs || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de acciones: usuario, módulo, IP y navegador
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin registros de auditoría"
          description="Las acciones del sistema se registrarán automáticamente aquí."
        />
      ) : (
        <GenericDataTable
          columns={[
            {
              key: 'user',
              label: 'Usuario',
              render: (row) => {
                const user = row.user as { email?: string } | string
                return typeof user === 'object' ? user?.email || '-' : String(user)
              },
            },
            { key: 'action', label: 'Acción' },
            { key: 'module', label: 'Módulo' },
            { key: 'ip', label: 'IP' },
            { key: 'userAgent', label: 'Navegador' },
            { key: 'createdAt', label: 'Fecha' },
          ]}
          data={rows}
        />
      )}
    </div>
  )
}
