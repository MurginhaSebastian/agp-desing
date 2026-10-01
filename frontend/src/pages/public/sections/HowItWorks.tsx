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

/*
 * Los cuatro pasos como hojas que se van apilando: cada una un poco más abajo, montada sobre
 * la anterior y con más sombra. La profundidad crece a medida que el encargo avanza, igual que
 * se van sumando capas en un cuadro 3D. Es una secuencia de verdad, por eso lleva números.
 * En móvil las hojas se apilan en vertical con un desplazamiento lateral creciente.
 */
const escalon = ['lg:mt-0', 'lg:mt-10', 'lg:mt-20', 'lg:mt-30']
const sangria = ['ml-0', 'ml-3', 'ml-6', 'ml-9']
const sombra = ['capa-1', 'capa-1', 'capa-2', 'capa-3']

export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-title" className="container-x pt-36 pb-24 md:pt-44 md:pb-32">
      <Reveal className="max-w-2xl">
        <h2 id="como-title" className="text-h2">
          Cuatro pasos. Desde tu idea hasta el unboxing.
        </h2>
      </Reveal>

      <ol className="mt-14 lg:mt-20 grid gap-4 lg:grid-cols-4 lg:gap-0">
        {steps.map((s, i) => (
          <Reveal
            as="li"
            key={s.title}
            delay={i * 70}
            className={`papel ${sombra[i]} ${escalon[i]} ${sangria[i]} relative p-7 lg:p-8 lg:ml-0 lg:-mr-3 last:lg:mr-0`}
          >
            <span className="font-display text-5xl leading-none text-brand tabular" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-h3 mt-6">{s.title}</h3>
            <p className="mt-3 text-ink-soft text-[0.9375rem] leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
