import CatalogListPage from '../components/modules/CatalogListPage'

export default function Racks() {
  return (
    <CatalogListPage
      title="Racks"
      description="Ubicaciones físicas de almacenamiento por sección"
      collection="racks"
      sort="code"
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nombre' },
        {
          key: 'section',
          label: 'Sección',
          render: (row) => {
            const s = row.section
            if (s && typeof s === 'object' && 'name' in s) return String(s.name)
            return '-'
          },
        },
        { key: 'active', label: 'Activo' },
      ]}
    />
  )
}
