import EntityCrudModule from '../components/modules/EntityCrudModule'

export default function Clientes() {
  return (
    <EntityCrudModule
      title="Clientes"
      description="Administra tu cartera de clientes"
      collection="customers"
      fields={[
        { key: 'name', label: 'Nombre / Razón social', required: true },
        { key: 'taxId', label: 'RUC / DNI' },
        { key: 'address', label: 'Dirección', type: 'textarea' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Correo', type: 'email' },
        { key: 'contactName', label: 'Contacto' },
      ]}
      columns={[
        { key: 'name', label: 'Nombre' },
        { key: 'taxId', label: 'RUC / DNI' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Correo' },
      ]}
    />
  )
}
