import { Link } from 'react-router-dom'

import LandingNav from '../components/landing/LandingNav'
import FooterSection from '../components/landing/FooterSection'

const PROMOTIONS = [
  {
    title: 'Descuento por volumen',
    description: 'Consulta precios especiales al comprar grandes cantidades de productos seleccionados.',
  },
  {
    title: 'Envío prioritario',
    description: 'Promoción temporal para pedidos confirmados antes del cierre de mes.',
  },
  {
    title: 'Nuevos clientes',
    description: 'Beneficios de bienvenida al registrarse como cliente del portal.',
  },
]

export default function Promociones() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />
      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <h1 className="text-3xl font-bold">Promociones</h1>
        <p className="mt-2 text-slate-500">
          Ofertas y beneficios disponibles para visitantes y clientes registrados.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROMOTIONS.map((item) => (
            <article key={item.title} className="glass-card p-5">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/catalogo" className="btn-primary">
            Ver catálogo
          </Link>
          <Link to="/register" className="btn-secondary">
            Registrarse como cliente
          </Link>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}
