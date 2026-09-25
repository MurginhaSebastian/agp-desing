import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Reveal } from '@/components/ui/Reveal'

const faqs = [
  {
    q: '¿Cuánto cuesta un cuadro o box?',
    a: 'Los precios varían según el nivel de personalización. En nuestro catálogo encontrarás opciones como el «Cuadro 3D» a 75,00 PEN y los «Boxes personalizados» completos a 115,00 PEN.',
  },
  {
    q: '¿Puedo pedir una temática que no está en el catálogo?',
    a: 'Sí, el diseño con propósito es nuestra especialidad. Adaptamos la estética, ya sean estadísticas de tu deporte favorito, réplicas de plataformas de streaming para aniversarios, o tributos con modelos a escala.',
  },
  {
    q: '¿Qué incluye la presentación del regalo?',
    a: 'El diseño no termina en el marco. Los boxes incluyen un empaque estructurado, fondos temáticos, tarjetas personalizadas y complementos visuales para lograr una experiencia completa.',
  },
  {
    q: '¿Hacen envíos?',
    a: 'Sí, coordinamos entregas asegurando que el producto y su empaque lleguen en perfectas condiciones.',
  },
  {
    q: '¿Cómo se paga?',
    a: 'Trabajamos con un adelanto del 50 % para iniciar la manufactura. Puedes realizar el pago de forma rápida a través de Yape o Plin.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const baseId = useId()

  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-nude">
      <div className="container-x section-y grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="label-brand">Preguntas frecuentes</p>
          <h2 id="faq-title" className="text-h2 mt-4">
            Lo que suelen preguntar antes de escribir.
          </h2>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-7 lg:col-start-6">
          <ul className="border-t border-ink">
            {faqs.map((f, i) => {
              const expanded = open === i
              const panelId = `${baseId}-panel-${i}`
              const btnId = `${baseId}-btn-${i}`
              return (
                <li key={f.q} className="border-b border-oat">
                  <h3 className="font-body text-base">
                    <button
                      id={btnId}
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      onClick={() => setOpen(expanded ? null : i)}
                      className="w-full flex items-center justify-between gap-6 py-5 text-left font-display text-2xl text-ink"
                    >
                      {f.q}
                      <Plus
                        size={22}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className={`shrink-0 text-brand transition-transform duration-200 [transition-timing-function:var(--ease-out)] ${expanded ? 'rotate-45' : ''}`}
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    className={`grid transition-[grid-template-rows] duration-200 [transition-timing-function:var(--ease-out)] ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 pr-10 text-ink-soft leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
