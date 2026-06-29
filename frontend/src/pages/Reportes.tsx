import { FileSpreadsheet, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import { fetchPurchaseReports } from '../lib/purchasesApi'

const legacyReports = [
  { id: 'inventory', name: 'Inventario General', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'low-stock', name: 'Stock Bajo', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'sales', name: 'Ventas', formats: ['PDF', 'Excel', 'CSV'] },
  { id: 'kardex', name: 'Kardex', formats: ['PDF', 'Excel', 'CSV'] },
]

const purchaseReportTypes = [
  { id: 'summary', name: 'Resumen de compras' },
  { id: 'pending', name: 'Compras pendientes' },
  { id: 'by-supplier', name: 'Compras por proveedor' },
  { id: 'by-product', name: 'Compras por producto' },
  { id: 'by-user', name: 'Compras por usuario' },
  { id: 'receptions', name: 'Recepciones' },
]

export default function Reportes() {
  const { permissions } = useAuth()
  const [selected, setSelected] = useState('summary')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const canReport = Boolean(permissions?.canReportPurchases ?? permissions?.modules.includes('reports'))

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase-reports', selected, from, to],
    queryFn: () =>
      fetchPurchaseReports({
        type: selected,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: canReport,
  })

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

  function exportPurchaseCsv() {
    if (!data?.docs?.length) return
    const rows = data.docs as Record<string, unknown>[]
    const headers = Object.keys(rows[0] ?? {})
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-compras-${selected}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="mt-1 text-sm text-slate-500">Reportes empresariales e informes de compras</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Compras (backend real)</h2>
        <div className="glass-card grid gap-3 p-4 md:grid-cols-4">
          <select className="input-field" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {purchaseReportTypes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={() => refetch()}>Consultar</Button>
        </div>

        {!canReport ? (
          <EmptyState title="Sin acceso" description="No tienes permiso para consultar reportes de compras." />
        ) : isLoading ? (
          <PageSkeleton />
        ) : error ? (
          <ErrorState message="No se pudo cargar el reporte." onRetry={() => refetch()} />
        ) : (
          <div className="glass-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {purchaseReportTypes.find((r) => r.id === selected)?.name} ({data?.docs?.length ?? 0})
              </h3>
              <Button variant="outline" onClick={exportPurchaseCsv} disabled={!data?.docs?.length}>
                <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
            {!data?.docs?.length ? (
              <EmptyState title="Sin resultados" description="No hay datos para los filtros seleccionados." />
            ) : (
              <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950/5 p-4 text-xs dark:bg-slate-950/40">
                {JSON.stringify(data.docs, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {legacyReports.map((report) => (
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
    </div>
  )
}
