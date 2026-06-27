import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:px-8 lg:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-flex rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Plataforma empresarial
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Gestiona tu inventario{' '}
            <span className="gradient-text">de forma inteligente</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Controla productos, movimientos, compras, ventas y reportes desde una sola plataforma.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/login" className="btn-primary">
              Iniciar Sesión
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#contacto" className="btn-secondary">
              <Play className="h-4 w-4" />
              Solicitar Demo
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <div className="glass-card-strong overflow-hidden p-1 shadow-glow">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Productos', value: '2,847' },
                  { label: 'Stock bajo', value: '12' },
                  { label: 'Ventas mes', value: 'S/ 48K' },
                  { label: 'Valor inventario', value: 'S/ 1.2M' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white/5 p-4">
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="mt-1 text-xl font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-32 rounded-lg bg-gradient-to-r from-primary-500/30 to-violet-500/30 p-4">
                <div className="flex h-full items-end gap-2">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary-400/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
