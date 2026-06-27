import { useParams, Link } from 'react-router-dom'

export default function LegalPage() {
  const { type } = useParams()
  const isPrivacy = type === 'privacidad'

  return (
    <div className="min-h-screen bg-surface px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm text-primary-500 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-6 text-3xl font-bold">
          {isPrivacy ? 'Política de privacidad' : 'Términos y condiciones'}
        </h1>
        <div className="prose prose-slate mt-8 dark:prose-invert">
          {isPrivacy ? (
            <>
              <p>
                Inventario Pro recopila únicamente la información necesaria para operar el servicio:
                datos de cuenta, registros de operaciones y logs de auditoría.
              </p>
              <p>
                No vendemos datos personales. Puedes solicitar eliminación de tu cuenta contactando a
                contacto@inventariopro.com.
              </p>
            </>
          ) : (
            <>
              <p>
                Al utilizar Inventario Pro aceptas usar la plataforma conforme a la legislación
                aplicable y mantener la confidencialidad de tus credenciales.
              </p>
              <p>
                El servicio se proporciona &quot;tal cual&quot;. Consulta el acuerdo completo con tu
                administrador empresarial.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
