import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import Button from '../ui/Button'
import GenericDataTable from '../table/GenericDataTable'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import Modal from '../ui/Modal'
import PageSkeleton from '../ui/PageSkeleton'
import Input from '../ui/Input'
import { createDocument, deleteDocument, fetchCollection, updateDocument } from '../../lib/api'

type FieldConfig = {
  key: string
  label: string
  type?: 'text' | 'email' | 'textarea'
  required?: boolean
}

type Props = {
  title: string
  description: string
  collection: string
  fields: FieldConfig[]
  columns: { key: string; label: string }[]
  getDisplayValue?: (row: Record<string, unknown>) => Record<string, unknown>
}

export default function EntityCrudModule({
  title,
  description,
  collection,
  fields,
  columns,
  getDisplayValue,
}: Props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [collection],
    queryFn: () => fetchCollection<Record<string, unknown>>(collection),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, active: form.active !== 'false' }
      if (editing?.id) {
        return updateDocument(collection, String(editing.id), payload)
      }
      return createDocument(collection, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collection] })
      setOpen(false)
      setEditing(null)
      setForm({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(collection, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [collection] }),
  })

  function openCreate() {
    setEditing(null)
    setForm(Object.fromEntries(fields.map((f) => [f.key, ''])))
    setOpen(true)
  }

  function openEdit(row: Record<string, unknown>) {
    setEditing(row)
    setForm(
      Object.fromEntries(
        fields.map((f) => [f.key, String(row[f.key] ?? '')]),
      ),
    )
    setOpen(true)
  }

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="Error al cargar datos." onRetry={() => refetch()} />

  const rows = (data?.docs || []).map((row: Record<string, unknown>) =>
    getDisplayValue ? getDisplayValue(row) : row,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin registros"
          description={`Comienza agregando tu primer registro en ${title.toLowerCase()}.`}
          actionLabel="Crear registro"
          onAction={openCreate}
        />
      ) : (
        <GenericDataTable
          columns={[
            ...columns,
            {
              key: 'actions',
              label: 'Acciones',
              render: (row: Record<string, unknown>) => (
                <div className="flex gap-2">
                  <button type="button" className="text-primary-500 text-sm" onClick={() => openEdit(row)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-red-500 text-sm"
                    onClick={() => deleteMutation.mutate(String(row.id))}
                  >
                    Eliminar
                  </button>
                </div>
              ),
            },
          ]}
          data={rows}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar' : 'Nuevo registro'}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="input-field min-h-[80px]"
                  value={form[field.key] || ''}
                  required={field.required}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={form[field.key] || ''}
                  required={field.required}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
