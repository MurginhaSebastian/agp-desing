import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { useSettings } from '@/hooks/useSettings'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

/**
 * Portada editorial. Una sola carga orquestada: numeral → titular → texto → acciones,
 * escalonado 70ms. Marketing surface: 700ms está dentro del presupuesto.
 */
export function Hero() {
  const reduce = useReducedMotion()
  const { settings } = useSettings()
  const heroImage = settings.heroImageUrl.trim()
  const item = (i: number) => ({
    initial: { opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(22px)' },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    transition: { duration: reduce ? 0.3 : 0.7, ease: EASE_OUT, delay: 0.08 + i * 0.07 },
  })

  return (
    <section id="inicio" aria-labelledby="hero-title" className="container-x pt-14 pb-20 md:pt-24 md:pb-28">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <motion.p {...item(0)} className="label-brand">
            Cuadros originales · Pintados a mano
          </motion.p>

          <motion.h1 {...item(1)} id="hero-title" className="text-display mt-6 max-w-[14ch]">
            Un cuadro que <em className="italic font-normal text-brand">no</em> existe todavía. Hasta que lo pides.
          </motion.h1>

          <motion.p {...item(2)} className="text-lead mt-8 max-w-[38ch] text-ink-soft">
            AGP Desing pinta piezas únicas para paredes concretas. Eliges del catálogo o pides algo a medida, y lo cerramos por WhatsApp. Sin carrito. Sin intermediarios.
          </motion.p>

          <motion.div {...item(3)} className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/catalogo" className="btn-primary">
              Ver el catálogo
              <ArrowDownRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <WhatsAppButton variant="secondary" />
          </motion.div>
        </div>

        {/* Columna lateral: la obra colgada (si el panel puso una) y la ficha técnica
            al estilo de etiqueta de museo. Asimetría a propósito. */}
        <motion.div {...item(4)} className="lg:col-span-3 lg:col-start-10 lg:self-end">
          {heroImage && (
            <figure className="mb-8 bg-nude overflow-hidden aspect-[3/4]">
              {/* Decorativa: el titular ya dice de qué va la portada, y el panel no
                  pide un texto alternativo que pudiéramos usar aquí. */}
              <img src={heroImage} alt="" className="size-full object-cover" decoding="async" />
            </figure>
          )}

          <aside className="border-t border-ink pt-5" aria-label="Datos del taller">
            <dl className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-y-5 gap-x-6">
              <div>
                <dt className="label">Técnica</dt>
                <dd className="mt-1 font-display text-2xl">Óleo · Acrílico · Mixta</dd>
              </div>
              <div>
                <dt className="label">Formatos</dt>
                <dd className="mt-1 font-display text-2xl">30 × 40 a 150 × 100 cm</dd>
              </div>
              <div>
                <dt className="label">Entrega</dt>
                <dd className="mt-1 font-display text-2xl">2 a 4 semanas</dd>
              </div>
            </dl>
          </aside>
        </motion.div>
      </div>
    </section>
  )
}
