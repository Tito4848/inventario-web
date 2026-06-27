import { Link } from 'react-router-dom'
import { Globe, Mail, Share2 } from 'lucide-react'

export default function FooterSection() {
  return (
    <footer id="contacto" className="border-t border-surface-border bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="text-xl font-bold text-white">Inventario Pro</div>
            <p className="mt-4 max-w-md text-sm text-slate-400">
              Plataforma empresarial de gestión de inventarios. Diseñada para tiendas, farmacias,
              ferreterías y empresas de distribución.
            </p>
            <div className="mt-6 flex gap-3">
              {[Share2, Globe, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition hover:bg-white/10"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white">Contacto</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> contacto@inventariopro.com
              </li>
              <li>+51 1 234 5678</li>
              <li>Lima, Perú</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/legal/privacidad" className="hover:text-white">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/legal/terminos" className="hover:text-white">
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Inventario Pro. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
