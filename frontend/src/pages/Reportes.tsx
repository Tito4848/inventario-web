import { FileSpreadsheet, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

const reports = [
  { id: 'inventory', name: 'Inventario General', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'low-stock', name: 'Stock Bajo', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'purchases', name: 'Compras', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'sales', name: 'Ventas', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'kardex', name: 'Kardex', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'by-category', name: 'Productos por Categoría', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'audit', name: 'Auditoría', formats: ['PDF', 'Excel', 'CSV'] },
]

export default function Reportes() {
  function exportReport(name: string, format: string) {
    const content = `Reporte: ${name}\nFormato: ${format}\nGenerado: ${new Date().toISOString()}`
    const blob = new Blob([content], { type: format === 'CSV' ? 'text/csv' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s/g, '-')}.${format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase()}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-1 text-sm text-slate-500">Genera y exporta reportes empresariales</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.id} className="glass-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{report.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.formats.map((format) => (
                    <Button
                      key={format}
                      variant="outline"
                      className="text-xs"
                      onClick={() => exportReport(report.name, format)}
                    >
                      <FileSpreadsheet className="h-3 w-3" />
                      {format}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <EmptyState
        title="Reportes programados"
        description="Próximamente podrás programar envíos automáticos de reportes por correo."
      />
    </div>
  )
}
