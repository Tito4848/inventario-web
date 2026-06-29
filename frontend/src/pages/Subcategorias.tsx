import CatalogListPage from '../components/modules/CatalogListPage'

export default function Subcategorias() {
  return (
    <CatalogListPage
      title="Subcategorías"
      description="Subcategorías vinculadas a cada categoría del catálogo"
      collection="subcategories"
      sort="name"
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nombre' },
        {
          key: 'category',
          label: 'Categoría',
          render: (row) => {
            const cat = row.category
            if (cat && typeof cat === 'object' && 'name' in cat) return String(cat.name)
            return '-'
          },
        },
        { key: 'isActive', label: 'Activo' },
      ]}
    />
  )
}
