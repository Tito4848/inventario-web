import { motion } from 'framer-motion'
import { BarChart3, Lock, Package, ShoppingCart, ShoppingBag, Users } from 'lucide-react'

const features = [
  {
    icon: Package,
    title: 'Inventario',
    desc: 'Productos, categorías, lotes, vencimientos y multi-almacén.',
  },
  {
    icon: ShoppingCart,
    title: 'Compras',
    desc: 'Órdenes de compra, recepciones y facturas de proveedores.',
  },
  {
    icon: ShoppingBag,
    title: 'Ventas',
    desc: 'Registro de ventas, descuentos, impuestos y clientes.',
  },
  {
    icon: BarChart3,
    title: 'Reportes',
    desc: 'Kardex, stock bajo, auditoría y exportación multi-formato.',
  },
  {
    icon: Users,
    title: 'Usuarios',
    desc: 'Roles personalizados: admin, supervisor, almacenero, vendedor.',
  },
  {
    icon: Lock,
    title: 'Seguridad',
    desc: 'JWT, refresh tokens, rate limiting y trazabilidad completa.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="caracteristicas" className="bg-slate-50 px-6 py-20 dark:bg-slate-900/50 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Características principales</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Módulos diseñados para operaciones reales de negocio.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -4 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group glass-card p-6 transition hover:border-primary-500/30 hover:shadow-glow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-soft transition group-hover:scale-105">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
