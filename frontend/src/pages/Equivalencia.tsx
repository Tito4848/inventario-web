import CatalogListPage from '../components/modules/CatalogListPage'

/** Campos poblados de la colección `units` (ver Unit en payload-types). */
type PopulatedUnit = {
  name: string
  abbreviation: string
}

function isPopulatedUnit(value: unknown): value is PopulatedUnit {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'abbreviation' in value &&
    typeof value.name === 'string' &&
    typeof value.abbreviation === 'string'
  )
}

function formatUnitLabel(value: unknown): string {
  if (!isPopulatedUnit(value)) return '-'
  return `${value.name} (${value.abbreviation})`
}

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
          render: (row) => formatUnitLabel(row.fromUnit),
        },
        {
          key: 'toUnit',
          label: 'Unidad destino',
          render: (row) => formatUnitLabel(row.toUnit),
        },
        { key: 'factor', label: 'Factor' },
        { key: 'active', label: 'Activo' },
      ]}
    />
  )
}
