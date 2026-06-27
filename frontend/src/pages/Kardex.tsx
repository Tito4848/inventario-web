import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import PageSkeleton from '../components/ui/PageSkeleton'
import EmptyState from '../components/ui/EmptyState'
import GenericDataTable from '../components/table/GenericDataTable'

type KardexRow = {
  date: string
  type: string
  quantity: number
  unitCost: number
  totalValue: number
  balance: number
  balanceValue: number
}

export default function Kardex() {
  const { data, isLoading } = useQuery({
    queryKey: ['kardex'],
    queryFn: () =>
      apiFetch<{ rows: KardexRow[] }>('/api/inventory/kardex', {
        params: { productId: 'sample' },
      }).catch(() => ({ rows: [] as KardexRow[] })),
  })

  if (isLoading) return <PageSkeleton />

  const rows = data?.rows || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kardex FIFO</h1>
        <p className="mt-1 text-sm text-slate-500">
          Entradas, salidas, costos, saldos y valorización
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Selecciona un producto"
          description="El kardex se genera por producto. Conecta con el backend para ver movimientos FIFO en tiempo real desde /api/inventory/kardex."
        />
      ) : (
        <GenericDataTable
          columns={[
            { key: 'date', label: 'Fecha' },
            { key: 'type', label: 'Tipo' },
            { key: 'quantity', label: 'Cantidad' },
            { key: 'unitCost', label: 'Costo unit.' },
            { key: 'totalValue', label: 'Valor total' },
            { key: 'balance', label: 'Saldo' },
            { key: 'balanceValue', label: 'Valor saldo' },
          ]}
          data={rows as unknown as Record<string, unknown>[]}
        />
      )}
    </div>
  )
}
