import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Reveal } from '@/components/ui/Reveal'

const faqs = [
  {
    q: '¿Cuánto cuesta un cuadro?',
    a: 'Depende del tamaño y la técnica. Los formatos pequeños (30 × 40 cm) arrancan alrededor de S/ 350; una pieza de metro y medio puede pasar de S/ 2.000. Cada obra del catálogo tiene su precio publicado.',
  },
  {
    q: '¿Puedo pedir un cuadro personalizado?',
    a: 'Sí. Es la mitad de lo que hacemos. Cuéntanos colores, medidas y dónde va a ir. Si tienes una referencia, mejor. Enviamos un boceto antes de empezar.',
  },
  {
    q: '¿Cuánto tarda?',
    a: 'Entre dos y cuatro semanas desde el abono, según la técnica. El óleo necesita más tiempo de secado que el acrílico. Si tienes una fecha límite, dilo al cotizar.',
  },
  {
    q: '¿Hacen envíos?',
    a: 'Sí, a todo el país. El cuadro viaja embalado en cartón rígido y plástico burbuja, con esquineros. El costo del envío se cotiza aparte según destino y tamaño.',
  },
  {
    q: '¿Cómo se paga?',
    a: '50 % para apartar y arrancar, 50 % al terminar, antes del envío o la entrega. Transferencia bancaria, Yape o Plin. No manejamos pagos en la web: todo se acuerda por WhatsApp.',
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
