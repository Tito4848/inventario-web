import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { Plus } from 'lucide-react'

export default function Compras() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="mt-1 text-sm text-slate-500">
            Órdenes de compra, recepciones y facturas de proveedores
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva orden
        </Button>
      </div>
      <EmptyState
        title="Módulo de compras"
        description="Registra órdenes de compra vinculadas a proveedores. La colección purchase-orders está lista en el backend."
        actionLabel="Ir a proveedores"
        onAction={() => (window.location.href = '/app/proveedores')}
      />
    </div>
  )
}
