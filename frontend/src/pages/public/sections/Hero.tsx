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
    <section id="inicio" aria-labelledby="hero-title" className="container-x pt-10 pb-16 md:pt-16 md:pb-20 lg:pt-20 short:pt-6 short:md:pt-8 short:lg:pt-8 short:pb-10">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <motion.p {...item(0)} className="label-brand">
            Detalles únicos · Ensamblados a mano
          </motion.p>

          <motion.h1 {...item(1)} id="hero-title" className="text-display mt-5 max-w-[17ch]">
            Tus recuerdos y pasiones <em className="italic font-normal text-brand">tangibles</em>. Nosotros los estructuramos.
          </motion.h1>

          <motion.p {...item(2)} className="text-lead mt-6 max-w-[42ch] text-ink-soft">
            AGP Desing materializa emociones y aficiones en cuadros personalizados y boxes temáticos con precisión técnica. Eliges del catálogo o diseñamos desde cero, y coordinamos cada detalle por WhatsApp. Sin carritos automatizados. Diseño empático y trato directo.
          </motion.p>

          <motion.div {...item(3)} className="mt-8 flex flex-wrap items-center gap-4">
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
                <dt className="label">Enfoque</dt>
                <dd className="mt-1 font-display text-2xl">Diseño 3D · Temático · Personalizado</dd>
              </div>
              <div>
                <dt className="label">Formatos</dt>
                <dd className="mt-1 font-display text-2xl">Cuadros con profundidad · Cajas decorativas · Placas interactivas</dd>
              </div>
              <div>
                <dt className="label">Elaboración</dt>
                <dd className="mt-1 font-display text-2xl">Manufactura meticulosa (Bajo pedido)</dd>
              </div>
            </dl>
          </aside>
        </motion.div>
      </div>
    </section>
  )
}
