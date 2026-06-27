import DataTable, { type ProductRow } from '../components/table/DataTable'
import Modal from '../components/ui/Modal'
import ProductForm from '../components/forms/ProductForm'
import { useState } from 'react'

const mock: ProductRow[] = [
  {
    id: 'p1',
    name: 'Laptop Pro 14"',
    sku: 'LP-14-2026',
    barcode: '1234567890123',
    description: 'Laptop profesional 14 pulgadas',
    category: 'Electrónica',
    subcategory: 'Computadoras',
    unit: 'unidad',
    purchasePrice: 800,
    salePrice: 1200,
    stock: 5,
    minStock: 3,
    status: 'active',
    supplier: 'Proveedor A',
    createdAt: '2026-01-12',
    updatedAt: '2026-05-02',
  },
  {
    id: 'p2',
    name: 'Mouse Óptico',
    sku: 'MS-100',
    barcode: '9876543210987',
    description: 'Mouse USB',
    category: 'Accesorios',
    subcategory: 'Periféricos',
    unit: 'unidad',
    purchasePrice: 5,
    salePrice: 10,
    stock: 15,
    minStock: 5,
    status: 'active',
    supplier: 'Proveedor B',
    createdAt: '2025-05-10',
    updatedAt: '2026-02-28',
  },
  {
    id: 'p3',
    name: 'Caja de Tornillos (100)',
    sku: 'BX-TS-100',
    barcode: '1112223334445',
    description: 'Tornillos varios',
    category: 'Insumos',
    subcategory: 'Ferretería',
    unit: 'caja',
    purchasePrice: 2,
    salePrice: 4,
    stock: 0,
    minStock: 10,
    status: 'out_of_stock',
    supplier: 'Proveedor C',
    createdAt: '2024-11-02',
    updatedAt: '2026-03-15',
  },
]

function Productos() {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<ProductRow[]>(mock)

  function handleCreate(p: ProductRow) {
    setProducts(prev => [p, ...prev])
    setOpen(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Productos</h2>
        <div>
          <button className="px-3 py-2 rounded-md bg-primary-500 text-white" onClick={() => setOpen(true)}>Nuevo Producto</button>
        </div>
      </div>

      <DataTable data={products} />

      <Modal open={open} onClose={() => setOpen(false)} title="Crear Producto">
        <ProductForm onSubmit={handleCreate} />
      </Modal>
    </div>
  )
}

export default Productos
