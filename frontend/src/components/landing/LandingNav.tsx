import { Link } from 'react-router-dom'
import ThemeToggle from '../ui/ThemeToggle'

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border/60 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="text-xl font-bold gradient-text">
          Inventario Pro
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400 md:flex">
          <a href="#caracteristicas" className="hover:text-primary-500">
            Características
          </a>
          <Link to="/catalogo" className="hover:text-primary-500">
            Catálogo
          </Link>
          <Link to="/promociones" className="hover:text-primary-500">
            Promociones
          </Link>
          <a href="#faq" className="hover:text-primary-500">
            FAQ
          </a>
          <a href="#contacto" className="hover:text-primary-500">
            Contacto
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login" className="btn-primary hidden sm:inline-flex">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  )
}
