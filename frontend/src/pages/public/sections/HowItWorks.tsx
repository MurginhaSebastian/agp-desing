import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    title: 'Eliges o describes',
    body: 'Miras el catálogo y escoges un cuadro, o nos cuentas qué tienes en mente: colores, tamaño, dónde va a colgarse. Una foto de la pared ayuda mucho.',
  },
  {
    title: 'Cotizamos por WhatsApp',
    body: 'Respondemos con precio, tiempo de entrega y, si es un encargo, un boceto rápido de la idea. Sin compromiso hasta que digas que sí.',
  },
  {
    title: 'Lo pintamos',
    body: 'Se aparta con un abono del 50 %. Te vamos mandando fotos del avance. Puedes pedir ajustes mientras la pintura aún está fresca.',
  },
  {
    title: 'Llega a tu pared',
    body: 'Entrega en mano en la ciudad o envío embalado para el resto del país. Cada cuadro sale con su ficha: técnica, medidas, fecha y firma.',
  },
]

/**
 * Lista numerada editorial, no cuatro tarjetas con icono. El número grande
 * en serif hace el trabajo visual; la regla superior separa cada paso.
 */
export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="container-x section-y">
      <Reveal className="max-w-2xl">
        <p className="label-brand">Cómo funciona</p>
        <h2 id="como-title" className="text-h2 mt-4">
          Cuatro pasos. Uno de ellos es esperar.
        </h2>
      </Reveal>

      <ol className="mt-14 lg:mt-20 grid gap-y-10 md:grid-cols-2 md:gap-x-12 lg:grid-cols-4 lg:gap-x-8">
        {steps.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 70} className="border-t border-ink pt-5">
            <span className="font-display text-6xl leading-none text-brand tabular" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-h3 mt-5">{s.title}</h3>
            <p className="mt-3 text-ink-soft text-[0.9375rem] leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
