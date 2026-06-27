import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { Plus } from 'lucide-react'

export default function Ventas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra ventas con clientes, productos, descuentos e impuestos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva venta
        </Button>
      </div>
      <EmptyState
        title="Módulo de ventas"
        description="Registra ventas vinculadas a clientes. La colección sales-orders está lista en el backend."
        actionLabel="Ir a clientes"
        onAction={() => (window.location.href = '/app/clientes')}
      />
    </div>
  )
}
