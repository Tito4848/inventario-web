import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Grid3x3,
  LayoutList,
  Package,
  Plus,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import ProductForm from '../components/forms/ProductForm'
import GenericDataTable from '../components/table/GenericDataTable'
import Pagination from '../components/table/Pagination'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Modal from '../components/ui/Modal'
import PageSkeleton from '../components/ui/PageSkeleton'
import { useAuth } from '../lib/AuthProvider'
import {
  activateProduct,
  createProduct,
  deactivateProduct,
  deleteProduct,
  fetchProductLookups,
  fetchProducts,
  updateProduct,
  type ManagedProduct,
  type ProductFormData,
} from '../lib/productsApi'

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  discontinued: 'Descontinuado',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    value ?? 0,
  )
}

function stockStatus(product: ManagedProduct): { label: string; className: string } {
  const stock = product.stock ?? 0
  const min = product.minStockBase ?? 0
  if (stock <= 0) return { label: 'Sin stock', className: 'text-red-600' }
  if (stock <= min) return { label: 'Stock bajo', className: 'text-amber-600' }
  return { label: 'Disponible', className: 'text-emerald-600' }
}

export default function Productos() {
  const { permissions } = useAuth()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedProduct | null>(null)
  const [editing, setEditing] = useState<ManagedProduct | null>(null)
  const [detail, setDetail] = useState<ManagedProduct | null>(null)

  const canWrite = Boolean(permissions?.canCreateProducts || permissions?.canEditProducts)
  const canDelete = Boolean(permissions?.canDeleteProducts)

  const queryKey = useMemo(
    () => ['products-manage', page, search, statusFilter, categoryFilter, activeFilter, sort],
    [page, search, statusFilter, categoryFilter, activeFilter, sort],
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchProducts({
        page,
        limit: 12,
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        active: activeFilter || undefined,
        sort,
      }),
    enabled: Boolean(permissions?.canViewProducts),
  })

  const { data: lookups } = useQuery({
    queryKey: ['product-lookups'],
    queryFn: fetchProductLookups,
    enabled: Boolean(permissions?.canViewProducts),
    staleTime: 5 * 60 * 1000,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['products-manage'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['public-products'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: ProductFormData) => {
      if (editing) return updateProduct(editing.id, payload)
      return createProduct(payload)
    },
    onSuccess: () => {
      invalidateAll()
      setFormOpen(false)
      setEditing(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidateAll()
      setDeleteTarget(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateProduct(id) : deactivateProduct(id),
    onSuccess: invalidateAll,
  })

  if (!permissions?.canViewProducts) {
    return <Navigate to="/app" replace />
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: ManagedProduct) {
    setEditing(product)
    setFormOpen(true)
    setDetailOpen(false)
  }

  function openDetail(product: ManagedProduct) {
    setDetail(product)
    setDetailOpen(true)
  }

  if (isLoading) return <PageSkeleton />
  if (error) return <ErrorState message="Error al cargar productos." onRetry={() => refetch()} />

  const rows = data?.docs ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Catálogo maestro con datos reales de MongoDB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-1">
            <button
              type="button"
              className={`rounded px-2 py-1 ${viewMode === 'table' ? 'bg-primary-500 text-white' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista tabla"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${viewMode === 'cards' ? 'bg-primary-500 text-white' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Vista tarjetas"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
          </div>
          {canWrite && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card grid gap-3 p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por nombre, SKU o código de barras…"
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
          <option value="discontinued">Descontinuado</option>
        </select>
        <select
          className="input-field"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas las categorías</option>
          {(lookups?.categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Activo / Inactivo</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
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
            <option value="name">Nombre A-Z</option>
            <option value="-name">Nombre Z-A</option>
            <option value="code">SKU A-Z</option>
            <option value="-updatedAt">Actualización (reciente)</option>
            <option value="salePrice">Precio venta ↑</option>
            <option value="-salePrice">Precio venta ↓</option>
          </select>
        </label>
        <span className="text-sm text-slate-500">{data?.totalDocs ?? 0} productos</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description="No hay productos que coincidan con los filtros."
          actionLabel={canWrite ? 'Crear producto' : undefined}
          onAction={canWrite ? openCreate : undefined}
        />
      ) : viewMode === 'table' ? (
        <GenericDataTable
          columns={[
            {
              key: 'image',
              label: '',
              render: (row) => {
                const p = row as unknown as ManagedProduct
                const url = p.images?.[0]?.url
                return url ? (
                  <img src={url} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                )
              },
            },
            { key: 'code', label: 'SKU' },
            { key: 'name', label: 'Nombre' },
            { key: 'categoryName', label: 'Categoría' },
            { key: 'brandName', label: 'Marca' },
            {
              key: 'salePrice',
              label: 'Precio venta',
              render: (row) => formatMoney((row as unknown as ManagedProduct).salePrice),
            },
            {
              key: 'stock',
              label: 'Stock',
              render: (row) => {
                const p = row as unknown as ManagedProduct
                const st = stockStatus(p)
                return (
                  <span>
                    {p.stock ?? 0}{' '}
                    <span className={`text-xs ${st.className}`}>({st.label})</span>
                  </span>
                )
              },
            },
            {
              key: 'status',
              label: 'Estado',
              render: (row) =>
                STATUS_LABELS[String((row as unknown as ManagedProduct).status)] ||
                String((row as unknown as ManagedProduct).status),
            },
            {
              key: 'actions',
              label: 'Acciones',
              render: (row) => {
                const product = row as unknown as ManagedProduct
                return (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-primary-500 text-sm"
                      onClick={() => openDetail(product)}
                    >
                      Ver
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        className="text-primary-500 text-sm"
                        onClick={() => openEdit(product)}
                      >
                        Editar
                      </button>
                    )}
                    {canWrite && !product.active && (
                      <button
                        type="button"
                        className="text-emerald-600 text-sm"
                        onClick={() => statusMutation.mutate({ id: product.id, active: true })}
                      >
                        Activar
                      </button>
                    )}
                    {canWrite && product.active && (
                      <button
                        type="button"
                        className="text-amber-600 text-sm"
                        onClick={() => statusMutation.mutate({ id: product.id, active: false })}
                      >
                        Desactivar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="text-red-500 text-sm"
                        onClick={() => setDeleteTarget(product)}
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((product) => {
            const st = stockStatus(product)
            const imageUrl = product.images?.[0]?.url
            return (
              <article key={product.id} className="glass-card flex flex-col overflow-hidden">
                <div className="aspect-video bg-slate-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-10 w-10 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs text-slate-500">{product.code}</p>
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{product.categoryName}</p>
                  <p className="mt-2 text-lg font-bold text-primary-500">
                    {formatMoney(product.salePrice)}
                  </p>
                  <p className={`mt-1 text-sm ${st.className}`}>
                    Stock: {product.stock ?? 0} · {st.label}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <button
                      type="button"
                      className="text-sm text-primary-500"
                      onClick={() => openDetail(product)}
                    >
                      Detalle
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        className="text-sm text-primary-500"
                        onClick={() => openEdit(product)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!!data?.totalPages && data.totalPages > 1 && (
        <Pagination page={page} pageCount={data.totalPages} onPageChange={setPage} />
      )}

      {lookups && (
        <Modal
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          title={editing ? 'Editar producto' : 'Nuevo producto'}
        >
          <ProductForm
            initial={editing}
            lookups={lookups}
            onSubmit={async (payload) => {
              await saveMutation.mutateAsync(payload)
            }}
            onCancel={() => {
              setFormOpen(false)
              setEditing(null)
            }}
          />
        </Modal>
      )}

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detalle del producto">
        {detail && (
          <div className="space-y-4 text-sm">
            {detail.images?.[0]?.url && (
              <img
                src={detail.images[0].url}
                alt={detail.name}
                className="mx-auto h-40 rounded-lg object-contain"
              />
            )}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className="text-slate-500">SKU</span>
                <p className="font-medium">{detail.code}</p>
              </div>
              <div>
                <span className="text-slate-500">Código de barras</span>
                <p className="font-medium">{detail.barcode || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-500">Nombre</span>
                <p className="font-medium">{detail.name}</p>
              </div>
              {detail.description && (
                <div className="md:col-span-2">
                  <span className="text-slate-500">Descripción</span>
                  <p>{detail.description}</p>
                </div>
              )}
              <div>
                <span className="text-slate-500">Categoría</span>
                <p>{detail.categoryName}</p>
              </div>
              <div>
                <span className="text-slate-500">Subcategoría</span>
                <p>{detail.subcategoryName || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Marca</span>
                <p>{detail.brandName || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Proveedor</span>
                <p>{detail.supplierName || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Unidad</span>
                <p>{detail.baseUnitName}</p>
              </div>
              <div>
                <span className="text-slate-500">Peso</span>
                <p>{detail.weight != null ? `${detail.weight} kg` : '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Precio compra</span>
                <p>{formatMoney(detail.purchasePrice)}</p>
              </div>
              <div>
                <span className="text-slate-500">Precio venta</span>
                <p>{formatMoney(detail.salePrice)}</p>
              </div>
              <div>
                <span className="text-slate-500">Stock actual</span>
                <p className={stockStatus(detail).className}>{detail.stock ?? 0}</p>
              </div>
              <div>
                <span className="text-slate-500">Stock mínimo</span>
                <p>{detail.minStockBase ?? 0}</p>
              </div>
              <div>
                <span className="text-slate-500">Estado</span>
                <p>{STATUS_LABELS[detail.status ?? 'active'] ?? detail.status}</p>
              </div>
              <div>
                <span className="text-slate-500">Creado</span>
                <p>{formatDate(detail.createdAt)}</p>
              </div>
              <div>
                <span className="text-slate-500">Actualizado</span>
                <p>{formatDate(detail.updatedAt)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {canWrite && (
                <Button
                  onClick={() => {
                    openEdit(detail)
                  }}
                >
                  Editar
                </Button>
              )}
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <p className="text-sm text-slate-600">
          ¿Eliminar el producto <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})? Esta
          acción no se puede deshacer.
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
