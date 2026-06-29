import { z } from 'zod'

export const productFormSchema = z.object({
  code: z.string().trim().min(1, 'El SKU es obligatorio'),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  baseUnit: z.string().min(1, 'La unidad de medida es obligatoria'),
  purchasePrice: z.coerce.number().min(0, 'El precio de compra debe ser ≥ 0'),
  salePrice: z.coerce.number().min(0, 'El precio de venta debe ser ≥ 0'),
  minStockBase: z.coerce.number().min(0, 'El stock mínimo debe ser ≥ 0'),
  weight: z.coerce.number().min(0, 'El peso debe ser ≥ 0').optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  active: z.boolean().default(true),
  taxRate: z.coerce.number().min(0).max(100).optional(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato de imagen no válido. Use JPEG, PNG, WebP o GIF.'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'La imagen no puede superar 5 MB.'
  }
  return null
}
