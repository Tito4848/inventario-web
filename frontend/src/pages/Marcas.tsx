import EntityCrudModule from '../components/modules/EntityCrudModule'

export default function Marcas() {
  return (
    <EntityCrudModule
      title="Marcas"
      description="Marcas comerciales del catálogo de productos"
      collection="brands"
      fields={[
        { key: 'code', label: 'Código', required: true },
        { key: 'name', label: 'Nombre', required: true },
        { key: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      columns={[
        { key: 'code', label: 'Código' },
        { key: 'name', label: 'Nombre' },
        { key: 'active', label: 'Activo' },
      ]}
    />
  )
}
