import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { FlechaAbajo } from '@/components/ui/iconos'
import { useSettings } from '@/hooks/useSettings'
import { CarruselPortada } from '@/pages/public/sections/CarruselPortada'
import type { Product } from '@/types/product'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
/** Cuántas fotos pasan por la caja de la portada. */
const MAX_FOTOS = 6

interface Props {
  /** Las obras del catálogo: la caja enseña las más recientes. */
  obras: Product[]
  cargando: boolean
}

/**
 * Portada: una caja de sombra, como las piezas del taller.
 *
 * A la izquierda el titular; a la derecha tres planos superpuestos (paspartú, papel y la foto
 * montada encima). Al cargar, los planos salen de un mismo punto y se separan hasta su sitio:
 * la profundidad se forma delante de quien mira. Es la única entrada orquestada de la web.
 * Texto: 70 ms entre líneas. Capas: 700 ms, ease-out. Con reduced-motion, solo se funden.
 */
export function Hero({ obras, cargando }: Props) {
  const reduce = useReducedMotion()
  const { settings } = useSettings()
  // Primero la imagen de portada del panel, si hay; luego las obras, de la más reciente a la más antigua.
  const recientes = [...obras].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const fotos = [...new Set([settings.heroImageUrl.trim(), ...recientes.map((o) => o.imageUrl)].filter(Boolean))].slice(0, MAX_FOTOS)

  const linea = (i: number) => ({
    initial: { opacity: 0, transform: reduce ? 'translateY(0px)' : 'translateY(18px)' },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    transition: { duration: reduce ? 0.3 : 0.7, ease: EASE_OUT, delay: 0.06 + i * 0.07 },
  })
  /*
   * Cada plano de detrás parte de la posición del de delante y se desplaza hasta la suya. El de
   * delante no se mueve: se posa (de 0,985 a 1), para que no aparezca de la nada con un fundido.
   */
  const plano = (i: number, desvio: number, escala = 1) => {
    const final = `translate(${desvio}px, ${desvio}px) scale(1)`
    return {
      initial: { opacity: 0, transform: reduce ? final : `translate(0px, 0px) scale(${escala})` },
      animate: { opacity: 1, transform: final },
      transition: { duration: reduce ? 0.3 : 0.7, ease: EASE_OUT, delay: 0.25 + i * 0.08 },
    }
  }

  return (
    <section id="inicio" aria-labelledby="hero-title" className="container-x pt-10 pb-24 md:pt-16 md:pb-32 lg:pt-20 short:pt-6 short:md:pt-8 short:lg:pt-8">
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-10 lg:items-start">
        <div className="lg:col-span-6">
          {/* El sello del taller. Dos líneas en vez de unir las dos ideas con un punto. */}
          <motion.p {...linea(0)} className="flex items-stretch gap-3 font-display text-[1.0625rem] leading-snug text-brand">
            <span aria-hidden="true" className="w-px bg-brand" />
            <span>
              <span className="block">Detalles únicos</span>
              <span className="block">Ensamblados a mano</span>
            </span>
          </motion.p>

          <motion.h1 {...linea(1)} id="hero-title" className="text-display mt-7 max-w-[15ch]">
            Tus recuerdos y pasiones tangibles.{' '}
            <span className="text-ink-soft">Nosotros los estructuramos.</span>
          </motion.h1>

          <motion.p {...linea(2)} className="text-lead mt-8 max-w-[44ch] text-ink-soft">
            AGP Desing materializa emociones y aficiones en cuadros personalizados y boxes temáticos con precisión técnica. Eliges del catálogo o diseñamos desde cero, y coordinamos cada detalle por WhatsApp. Sin carritos automatizados. Diseño empático y trato directo.
          </motion.p>

          <motion.div {...linea(3)} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link to="/catalogo" className="boton">
              Ver el catálogo
              <FlechaAbajo size={18} />
            </Link>
            <WhatsAppButton variant="secondary" />
          </motion.div>
        </div>

        {/*
          La caja de sombra: planos a la derecha y abajo, porque la luz viene de arriba a la
          izquierda. La caja toma la forma de la FOTO (la foto se ve entera, nunca recortada): los
          planos de detrás miden lo mismo que la de delante porque se estiran sobre ella.
        */}
        <div className="lg:col-span-6 pr-7 sm:pr-8">
          {/*
            Escenario cuadrado: con fotos verticales y horizontales pasando por la misma caja, la
            caja no puede tomar la forma de cada una (saltaría en cada cambio). El margen de abajo
            del paspartú es más ancho y lleva los controles, como el Nº de las obras del catálogo.
            El tope en vh evita que en portátiles bajos la caja no quepa en la pantalla.
          */}
          <div className="relative mx-auto w-full max-w-[min(38rem,calc(68vh+3.5rem))]">
            <motion.div {...plano(0, 28)} aria-hidden="true" className="absolute inset-0 paspartu capa-1" />
            <motion.div {...plano(1, 14)} aria-hidden="true" className="absolute inset-0 papel capa-2" />
            <motion.figure {...plano(2, 0, 0.985)} className="relative paspartu capa-3 p-5 pb-14 sm:p-7 sm:pb-16">
              <CarruselPortada fotos={fotos} cargando={cargando} />
            </motion.figure>
          </div>

          {/*
            La ficha del taller, como la etiqueta que cuelga de una pieza: debajo de la caja,
            montada sobre su borde, sin tapar nunca la obra.
          */}
          <motion.aside
            {...linea(5)}
            aria-label="Datos del taller"
            className="papel capa-2 relative z-10 mt-5 sm:-mt-6 ml-0 sm:-ml-6 w-[min(18rem,86%)] p-5"
          >
              <dl className="space-y-3.5">
                <div>
                  <dt className="nota">Enfoque</dt>
                  <dd className="font-display text-[1.0625rem] leading-snug mt-0.5">Diseño 3D · Temático · Personalizado</dd>
                </div>
                <div>
                  <dt className="nota">Formatos</dt>
                  <dd className="font-display text-[1.0625rem] leading-snug mt-0.5">Cuadros con profundidad · Cajas decorativas · Placas interactivas</dd>
                </div>
                <div>
                  <dt className="nota">Elaboración</dt>
                  <dd className="font-display text-[1.0625rem] leading-snug mt-0.5">Manufactura meticulosa (Bajo pedido)</dd>
                </div>
              </dl>
            </motion.aside>
        </div>
      </div>
    </section>
  )
}
