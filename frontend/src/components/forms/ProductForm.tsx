import React, { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { createProduct } from '../../lib/api'

const productSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  minStockBase: z.number().min(0).optional().or(z.string()).transform((v) => Number(v || 0)),
  salePrice: z.number().min(0).optional().or(z.string()).transform((v) => Number(v || 0)),
  active: z.boolean().optional(),
})

type FormData = z.infer<typeof productSchema>

export default function ProductForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { active: true },
  })

  const [, setFile] = useState<File | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f ?? null)
    if (!f) return setImagePreview(null)
    setImagePreview(URL.createObjectURL(f))
  }

  async function submit(data: FormData) {
    try {
      const payload = {
        code: data.code,
        name: data.name,
        description: data.description,
        minStockBase: Number(data.minStockBase || 0),
        salePrice: Number(data.salePrice || 0),
        active: data.active ?? true,
      }

      if (import.meta.env.VITE_API_URL) {
        const res = await createProduct(payload) as { doc?: unknown }
        onSubmit(res?.doc ?? res)
      } else {
        const product = {
          id: `p_${Date.now()}`,
          ...payload,
          stock: 0,
          image: imagePreview,
        }
        onSubmit(product)
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message ?? 'Error creating product')
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-500">Código</label>
        <Input {...register('code')} />
        {errors.code && <div className="text-red-500 text-sm">{String(errors.code.message)}</div>}
      </div>

      <div>
        <label className="block text-sm text-gray-500">Nombre</label>
        <Input {...register('name')} />
        {errors.name && <div className="text-red-500 text-sm">{String(errors.name.message)}</div>}
      </div>

      <div>
        <label className="block text-sm text-gray-500">Descripción</label>
        <textarea {...register('description' as any)} className="w-full rounded-md p-2 bg-white/5" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm text-gray-500">Stock mínimo</label>
          <Input type="number" {...register('minStockBase' as any)} />
        </div>
        <div>
          <label className="block text-sm text-gray-500">Precio venta</label>
          <Input type="number" step="0.01" {...register('salePrice' as any)} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-500">Imagen</label>
        <input type="file" accept="image/*" onChange={handleFile} />
        {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 h-20" />}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
