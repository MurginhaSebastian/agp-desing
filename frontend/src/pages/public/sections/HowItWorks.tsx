import { Reveal } from '@/components/ui/Reveal'

const steps = [
  {
    title: 'Exploras o propones',
    body: 'Miras el catálogo y escoges un diseño, o nos detallas a fondo esa afición, fecha o recuerdo que deseas encapsular.',
  },
  {
    title: 'Diseñamos por WhatsApp',
    body: 'Te respondemos con el precio, los detalles técnicos de la pieza y, si es un encargo a medida, estructuramos la idea inicial contigo.',
  },
  {
    title: 'Manufactura y precisión',
    body: 'Se aparta con un abono del 50 %. Iniciamos la producción meticulosa de tu cuadro o box, asegurando que la estética y la calidad física encajen perfectamente.',
  },
  {
    title: 'La experiencia de entrega',
    body: 'Recibes una caja con ingeniería de empaque, pensada para que el impacto emocional y visual comience desde el primer segundo en que se abre.',
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
          Cuatro pasos. Desde tu idea hasta el unboxing.
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
