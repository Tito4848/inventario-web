import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[500px] rounded-full bg-violet-500/15 blur-3xl" />
      </div>

      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-white lg:flex">
        <Link to="/" className="text-2xl font-bold">
          Inventario Pro
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Control total de tu inventario empresarial
          </h2>
          <p className="mt-4 text-slate-400">
            Compras, ventas, kardex FIFO, reportes y seguridad en una plataforma moderna.
          </p>
        </div>
        <p className="text-sm text-slate-500">© Inventario Pro</p>
      </div>

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="text-lg font-bold gradient-text lg:hidden">
            Inventario Pro
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
