import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: '¿Puedo usar el sistema en farmacias y ferreterías?',
    a: 'Sí. Inventario Pro soporta lotes, vencimientos, multi-almacén y unidades de medida personalizadas para distintos rubros.',
  },
  {
    q: '¿Cómo funciona el kardex FIFO?',
    a: 'Cada entrada genera un lote con costo unitario. Las salidas consumen los lotes más antiguos primero, manteniendo saldos y valorización precisos.',
  },
  {
    q: '¿Puedo exportar reportes?',
    a: 'Sí. Genera reportes en PDF, Excel y CSV: inventario general, stock bajo, compras, ventas, kardex y auditoría.',
  },
  {
    q: '¿Es seguro para empresas?',
    a: 'Implementamos JWT, refresh tokens, roles granulares, auditoría de acciones, rate limiting y sanitización de datos.',
  },
  {
    q: '¿Funciona en móvil?',
    a: 'Sí. Es una PWA instalable con diseño responsive para operaciones en almacén y punto de venta.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="glass-card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left font-medium"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDown
                  className={`h-5 w-5 transition ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-surface-border px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
