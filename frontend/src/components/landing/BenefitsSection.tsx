import { motion } from 'framer-motion'
import { BarChart3, Package, Shield, TrendingUp, Users } from 'lucide-react'

const benefits = [
  { icon: Package, title: 'Gestión de inventario', desc: 'Control total de productos y ubicaciones.' },
  { icon: TrendingUp, title: 'Control de stock', desc: 'Alertas automáticas de stock bajo y agotado.' },
  { icon: BarChart3, title: 'Kardex FIFO', desc: 'Valorización precisa con método FIFO.' },
  { icon: BarChart3, title: 'Reportes avanzados', desc: 'Exporta PDF, Excel y CSV al instante.' },
  { icon: Shield, title: 'Seguridad empresarial', desc: 'Roles, permisos y auditoría completa.' },
  { icon: Users, title: 'Multiusuario', desc: 'Equipos colaborando en tiempo real.' },
]

export default function BenefitsSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Beneficios que impulsan tu negocio</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Todo lo que necesitas para operar con precisión y escala.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 transition hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
