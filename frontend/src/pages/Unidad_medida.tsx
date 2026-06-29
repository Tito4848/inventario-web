import EntityCrudModule from '../components/modules/EntityCrudModule'

export default function Unidad_medida() {
  return (
    <EntityCrudModule
      title="Unidades de medida"
      description="Unidades base del catálogo (UND, KG, LTR, etc.)"
      collection="units"
      fields={[
        { key: 'name', label: 'Nombre', required: true },
        { key: 'abbreviation', label: 'Abreviatura', required: true },
      ]}
      columns={[
        { key: 'name', label: 'Unidad' },
        { key: 'abbreviation', label: 'Abreviatura' },
        { key: 'active', label: 'Activo' },
      ]}
    />
  )
}
