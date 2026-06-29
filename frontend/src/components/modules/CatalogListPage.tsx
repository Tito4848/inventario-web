import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import GenericDataTable from '../table/GenericDataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import PageSkeleton from '../ui/PageSkeleton'
import { fetchCollection } from '../../lib/api'

type Column = {
  key: string
  label: string
  render?: (row: Record<string, unknown>) => ReactNode
}

type Props = {
  title: string
  description: string
  collection: string
  columns: Column[]
  limit?: number
  sort?: string
}

function relName(value: unknown, fallback = '-'): string {
  if (!value) return fallback
  if (typeof value === 'object' && value !== null && 'name' in value) {
    return String((value as { name?: string }).name ?? fallback)
  }
  return String(value)
}

export default function CatalogListPage({
  title,
  description,
  collection,
  columns,
  limit = 200,
  sort = 'name',
}: Props) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', collection, limit, sort],
    queryFn: () =>
      fetchCollection<Record<string, unknown>>(collection, {
        limit,
        depth: 1,
        sort,
      }),
  })

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message={`Error al cargar ${title.toLowerCase()}.`} onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <p className="mt-1 text-xs text-slate-400">{data?.totalDocs ?? 0} registros</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin registros"
          description={`No hay datos en ${title.toLowerCase()}. Ejecuta npm run seed en el backend.`}
        />
      ) : (
        <GenericDataTable
          columns={columns.map((col) => ({
            ...col,
            render: col.render
              ? (row: Record<string, unknown>) => col.render!(row)
              : (row: Record<string, unknown>) => {
                  const value = row[col.key]
                  if (col.key === 'category' || col.key === 'section' || col.key === 'fromUnit' || col.key === 'toUnit') {
                    return relName(value)
                  }
                  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
                  return value != null ? String(value) : '-'
                },
          }))}
          data={rows}
        />
      )}
    </div>
  )
}
