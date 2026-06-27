import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'María González',
    role: 'Gerente, Farmacia Salud Total',
    text: 'Reducimos pérdidas por vencimiento un 40%. El kardex FIFO nos dio visibilidad total del costo real.',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Director, Distribuidora Norte',
    text: 'La plataforma reemplazó 3 sistemas. Compras, ventas e inventario en un solo lugar.',
  },
  {
    name: 'Ana Ruiz',
    role: 'Propietaria, Ferretería El Tornillo',
    text: 'Interfaz moderna y fácil de usar. Mi equipo aprendió a usarla en menos de un día.',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="bg-slate-50 px-6 py-20 dark:bg-slate-900/50 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold">Lo que dicen nuestros clientes</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="mb-4 flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">&ldquo;{t.text}&rdquo;</p>
              <footer className="mt-4">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-slate-500">{t.role}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
