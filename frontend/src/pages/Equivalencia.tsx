import CatalogListPage from '../components/modules/CatalogListPage'

export default function Equivalencia() {
  return (
    <CatalogListPage
      title="Equivalencias de unidades"
      description="Factores de conversión entre unidades (ej. 1 Caja = 12 Unidades)"
      collection="unit-equivalences"
      sort="label"
      columns={[
        { key: 'label', label: 'Descripción' },
        {
          key: 'fromUnit',
          label: 'Unidad origen',
          render: (row) => {
            const u = row.fromUnit
            if (u && typeof u === 'object' && 'abbreviation' in u) {
              return `${u.name} (${u.abbreviation})`
            }
            return '-'
          },
        },
        {
          key: 'toUnit',
          label: 'Unidad destino',
          render: (row) => {
            const u = row.toUnit
            if (u && typeof u === 'object' && 'abbreviation' in u) {
              return `${u.name} (${u.abbreviation})`
            }
            return '-'
          },
        },
        { key: 'factor', label: 'Factor' },
        { key: 'active', label: 'Activo' },
      ]}
    />
  )
}
