import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import LandingNav from '../components/landing/LandingNav'
import FooterSection from '../components/landing/FooterSection'
import { fetchPublicProducts } from '../lib/usersApi'

export default function CatalogoPublico() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['public-products', search],
    queryFn: () => fetchPublicProducts({ search: search || undefined, limit: 24 }),
  })

  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Catálogo público</h1>
          <p className="mt-2 text-slate-500">
            Consulta productos disponibles sin acceder al panel administrativo.
          </p>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-slate-500">Cargando productos…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.docs ?? []).map((product) => (
              <article key={String(product.id)} className="glass-card p-5">
                <h2 className="font-semibold">{String(product.name ?? 'Producto')}</h2>
                <p className="mt-1 text-sm text-slate-500">Código: {String(product.code ?? '-')}</p>
                {product.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{String(product.description)}</p>
                ) : null}
                <p className="mt-3 text-lg font-bold text-primary-500">
                  S/ {Number(product.salePrice ?? 0).toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        )}

        {!isLoading && !data?.docs?.length && (
          <p className="text-slate-500">No se encontraron productos.</p>
        )}

        <div className="mt-10">
          <Link to="/promociones" className="text-primary-500 hover:underline">
            Ver promociones →
          </Link>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}
