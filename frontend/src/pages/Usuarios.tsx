import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import GenericDataTable from '../components/table/GenericDataTable'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import PageSkeleton from '../components/ui/PageSkeleton'
import Pagination from '../components/table/Pagination'
import { useAuth } from '../lib/AuthProvider'
import { CRITICAL_ROLES, isOperationalUser, ROLE_OPTIONS } from '../lib/permissions'
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
  type ManagedUser,
} from '../lib/usersApi'
import { validatePassword } from '../lib/authValidation'

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  locked: 'Bloqueado',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function Usuarios() {
  const { permissions } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sort, setSort] = useState('-createdAt')

  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    roles: ['invitado'] as string[],
    status: 'active',
  })

  const queryKey = useMemo(
    () => ['users-manage', page, search, statusFilter, roleFilter, sort],
    [page, search, statusFilter, roleFilter, sort],
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchUsers({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        sort,
      }),
    enabled: Boolean(permissions?.canViewUsers),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editing && !form.password) throw new Error('La contraseña es obligatoria')
      if (form.password) {
        const check = validatePassword(form.password)
        if (!check.ok) throw new Error(check.message)
      }

      if (editing) {
        const payload: Record<string, unknown> = {
          fullName: form.fullName,
          status: form.status,
        }
        if (form.password) payload.password = form.password
        if (permissions?.canManageUsers) payload.roles = form.roles
        return updateUser(editing.id, payload)
      }

      return createUser({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        roles: form.roles,
        status: form.status,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-manage'] })
      setOpen(false)
      setEditing(null)
      setFormError(null)
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-manage'] })
      setDeleteTarget(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateUser(id) : deactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-manage'] }),
  })

  const resetMutation = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
  })

  function canEditRow(row: ManagedUser): boolean {
    if (permissions?.canManageUsers) return true
    if (permissions?.canEditOperationalUsers && isOperationalUser(row.roles)) return true
    return false
  }

  if (!permissions?.canViewUsers) {
    return <Navigate to="/app" replace />
  }

  function openCreate() {
    setEditing(null)
    setForm({
      email: '',
      password: '',
      fullName: '',
      roles: ['warehouse'],
      status: 'active',
    })
    setFormError(null)
    setOpen(true)
  }

  function openEdit(row: ManagedUser) {
    setEditing(row)
    setForm({
      email: row.email,
      password: '',
      fullName: row.fullName || '',
      roles: row.roles,
      status: row.status,
    })
    setFormError(null)
    setOpen(true)
  }

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="Error al cargar usuarios." onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestión de cuentas, roles y accesos del sistema
          </p>
        </div>
        {permissions.canManageUsers && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        )}
      </div>

      <div className="glass-card grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por correo o nombre…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="locked">Bloqueado</option>
        </select>
        <select
          className="input-field"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todos los roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="text-sm text-slate-500">
          Ordenar por{' '}
          <select
            className="input-field ml-2 inline-block w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="-createdAt">Creación (reciente)</option>
            <option value="createdAt">Creación (antiguo)</option>
            <option value="email">Correo A-Z</option>
            <option value="-email">Correo Z-A</option>
            <option value="-lastLoginAt">Último acceso</option>
          </select>
        </label>
        <span className="text-sm text-slate-500">{data?.totalDocs ?? 0} usuarios</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin usuarios"
          description="No hay usuarios que coincidan con los filtros."
          actionLabel={permissions.canManageUsers ? 'Crear usuario' : undefined}
          onAction={permissions.canManageUsers ? openCreate : undefined}
        />
      ) : (
        <GenericDataTable
          columns={[
            { key: 'email', label: 'Correo' },
            { key: 'fullName', label: 'Nombre' },
            {
              key: 'roles',
              label: 'Roles',
              render: (row) => (row.roles as string[]).join(', '),
            },
            {
              key: 'status',
              label: 'Estado',
              render: (row) => STATUS_LABELS[String(row.status)] || String(row.status),
            },
            {
              key: 'createdAt',
              label: 'Creación',
              render: (row) => formatDate(row.createdAt as string),
            },
            {
              key: 'lastLoginAt',
              label: 'Último acceso',
              render: (row) => formatDate(row.lastLoginAt as string | null),
            },
            {
              key: 'actions',
              label: 'Acciones',
              render: (row) => {
                const user = row as unknown as ManagedUser
                const editable = canEditRow(user)
                const isCritical = user.roles.some((r) =>
                  (CRITICAL_ROLES as readonly string[]).includes(r),
                )

                return (
                  <div className="flex flex-wrap gap-2">
                    {editable && (
                      <button type="button" className="text-primary-500 text-sm" onClick={() => openEdit(user)}>
                        Editar
                      </button>
                    )}
                    {editable && user.status !== 'active' && (
                      <button
                        type="button"
                        className="text-emerald-600 text-sm"
                        onClick={() => statusMutation.mutate({ id: user.id, active: true })}
                      >
                        Activar
                      </button>
                    )}
                    {editable && user.status === 'active' && (
                      <button
                        type="button"
                        className="text-amber-600 text-sm"
                        onClick={() => statusMutation.mutate({ id: user.id, active: false })}
                      >
                        Desactivar
                      </button>
                    )}
                    {permissions.canResetPasswords && (
                      <button
                        type="button"
                        className="text-slate-600 text-sm"
                        onClick={() => resetMutation.mutate(user.id)}
                      >
                        Restablecer clave
                      </button>
                    )}
                    {permissions.canDeleteUsers && !isCritical && (
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => setDeleteTarget(user)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )
              },
            },
          ]}
          data={rows as unknown as Record<string, unknown>[]}
        />
      )}

      {!!data?.totalPages && data.totalPages > 1 && (
        <Pagination page={page} pageCount={data.totalPages} onPageChange={setPage} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium">Correo</label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Nombre completo</label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            </label>
            <Input
              type="password"
              required={!editing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {permissions.canManageUsers && (
            <div>
              <label className="mb-1 block text-sm font-medium">Roles</label>
              <select
                multiple
                className="input-field min-h-[120px]"
                value={form.roles}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
                  setForm({ ...form, roles: selected.length ? selected : ['invitado'] })
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(permissions.canManageUsers || permissions.canEditOperationalUsers) && (
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="locked">Bloqueado</option>
              </select>
            </div>
          )}

          {formError && <p className="text-sm text-red-500">{formError}</p>}

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

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <p className="text-sm text-slate-600">
          ¿Eliminar al usuario <strong>{deleteTarget?.email}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 text-white hover:opacity-95"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
