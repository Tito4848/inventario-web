import EntityCrudModule from '../components/modules/EntityCrudModule'

export default function Proveedores() {
  return (
    <EntityCrudModule
      title="Proveedores"
      description="Gestiona proveedores, contactos y datos fiscales"
      collection="suppliers"
      fields={[
        { key: 'businessName', label: 'Razón social', required: true },
        { key: 'taxId', label: 'RUC', required: true },
        { key: 'address', label: 'Dirección', type: 'textarea' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Correo', type: 'email' },
        { key: 'contactName', label: 'Contacto' },
      ]}
      columns={[
        { key: 'businessName', label: 'Razón social' },
        { key: 'taxId', label: 'RUC' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'email', label: 'Correo' },
      ]}
    />
  )
}
