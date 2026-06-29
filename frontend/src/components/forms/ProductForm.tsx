import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import Button from '../ui/Button'
import Input from '../ui/Input'
import {
  type ManagedProduct,
  type ProductFormData,
  uploadProductImage,
} from '../../lib/productsApi'
import {
  productFormSchema,
  validateImageFile,
  type ProductFormValues,
} from '../../lib/productValidation'

type LookupData = {
  categories: Array<{ id: string; label: string }>
  subcategories: Array<{ id: string; label: string; categoryId: string }>
  brands: Array<{ id: string; label: string }>
  suppliers: Array<{ id: string; label: string }>
  units: Array<{ id: string; label: string }>
}

type Props = {
  initial?: ManagedProduct | null
  lookups: LookupData
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  readOnly?: boolean
}

export default function ProductForm({
  initial,
  lookups,
  onSubmit,
  onCancel,
  readOnly = false,
}: Props) {
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState(initial?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: initial?.code ?? '',
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      barcode: initial?.barcode ?? '',
      category: initial?.category ?? '',
      subcategory: initial?.subcategory ?? '',
      brand: initial?.brand ?? '',
      supplier: initial?.supplier ?? '',
      baseUnit: initial?.baseUnit ?? '',
      purchasePrice: initial?.purchasePrice ?? 0,
      salePrice: initial?.salePrice ?? 0,
      minStockBase: initial?.minStockBase ?? 0,
      weight: initial?.weight ?? undefined,
      status: (initial?.status as ProductFormValues['status']) ?? 'active',
      active: initial?.active !== false,
      taxRate: initial?.taxRate ?? 18,
    },
  })

  const selectedCategory = watch('category')

  const filteredSubcategories = useMemo(
    () => lookups.subcategories.filter((s) => s.categoryId === selectedCategory),
    [lookups.subcategories, selectedCategory],
  )

  useEffect(() => {
    if (
      selectedCategory &&
      watch('subcategory') &&
      !filteredSubcategories.some((s) => s.id === watch('subcategory'))
    ) {
      setValue('subcategory', '')
    }
  }, [selectedCategory, filteredSubcategories, setValue, watch])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const err = validateImageFile(file)
      if (err) {
        setFormError(err)
        return
      }
    }
    setFormError(null)
    setImageFiles((prev) => [...prev, ...files])
  }

  function removeExistingImage(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
  }

  function removeNewImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit(values: ProductFormValues) {
    setFormError(null)
    setUploading(true)
    try {
      const uploadedIds: string[] = []
      for (const file of imageFiles) {
        const id = await uploadProductImage(file, values.name || values.code)
        uploadedIds.push(id)
      }

      const payload: ProductFormData = {
        code: values.code,
        name: values.name,
        description: values.description,
        barcode: values.barcode,
        category: values.category,
        subcategory: values.subcategory || undefined,
        brand: values.brand || undefined,
        supplier: values.supplier || undefined,
        baseUnit: values.baseUnit,
        purchasePrice: values.purchasePrice,
        salePrice: values.salePrice,
        minStockBase: values.minStockBase,
        weight: values.weight === '' || values.weight == null ? undefined : Number(values.weight),
        status: values.status,
        active: values.active,
        taxRate: values.taxRate,
        images: [...existingImages.map((i) => i.id), ...uploadedIds],
      }

      await onSubmit(payload)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el producto')
    } finally {
      setUploading(false)
    }
  }

  const disabled = readOnly || isSubmitting || uploading

  return (
    <form className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">SKU *</label>
          <Input {...register('code')} disabled={disabled} />
          {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Código de barras</label>
          <Input {...register('barcode')} disabled={disabled} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Nombre *</label>
        <Input {...register('name')} disabled={disabled} />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descripción</label>
        <textarea
          {...register('description')}
          className="input-field min-h-[80px]"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoría *</label>
          <select className="input-field" {...register('category')} disabled={disabled}>
            <option value="">Seleccionar…</option>
            {lookups.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subcategoría</label>
          <select className="input-field" {...register('subcategory')} disabled={disabled}>
            <option value="">Seleccionar…</option>
            {filteredSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Marca</label>
          <select className="input-field" {...register('brand')} disabled={disabled}>
            <option value="">Seleccionar…</option>
            {lookups.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Proveedor</label>
          <select className="input-field" {...register('supplier')} disabled={disabled}>
            <option value="">Seleccionar…</option>
            {lookups.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Unidad de medida *</label>
          <select className="input-field" {...register('baseUnit')} disabled={disabled}>
            <option value="">Seleccionar…</option>
            {lookups.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
          {errors.baseUnit && (
            <p className="mt-1 text-sm text-red-500">{errors.baseUnit.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Peso (kg)</label>
          <Input type="number" step="0.001" min="0" {...register('weight')} disabled={disabled} />
          {errors.weight && <p className="mt-1 text-sm text-red-500">{errors.weight.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Precio compra</label>
          <Input type="number" step="0.01" min="0" {...register('purchasePrice')} disabled={disabled} />
          {errors.purchasePrice && (
            <p className="mt-1 text-sm text-red-500">{errors.purchasePrice.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Precio venta</label>
          <Input type="number" step="0.01" min="0" {...register('salePrice')} disabled={disabled} />
          {errors.salePrice && (
            <p className="mt-1 text-sm text-red-500">{errors.salePrice.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Stock mínimo</label>
          <Input type="number" step="1" min="0" {...register('minStockBase')} disabled={disabled} />
          {errors.minStockBase && (
            <p className="mt-1 text-sm text-red-500">{errors.minStockBase.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Estado</label>
          <select className="input-field" {...register('status')} disabled={disabled}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="discontinued">Descontinuado</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input type="checkbox" id="product-active" {...register('active')} disabled={disabled} />
          <label htmlFor="product-active" className="text-sm">
            Visible en catálogo
          </label>
        </div>
      </div>

      {!readOnly && (
        <div>
          <label className="mb-1 block text-sm font-medium">Imágenes</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileChange}
            disabled={disabled}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                {img.url ? (
                  <img src={img.url} alt={img.alt ?? ''} className="h-16 w-16 rounded object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-100 text-xs">
                    IMG
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white"
                  onClick={() => removeExistingImage(img.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {imageFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="h-16 w-16 rounded object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs text-white"
                  onClick={() => removeNewImage(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={disabled}>
            {uploading || isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        )}
      </div>
    </form>
  )
}
