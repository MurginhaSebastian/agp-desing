import { Reveal } from '@/components/ui/Reveal'

export function About() {
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-nude">
      <div className="container-x section-y grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="label-brand">Sobre AGP desing</p>
          <h2 id="sobre-title" className="text-h2 mt-4">
            Ingeniería visual para tus mejores recuerdos.
          </h2>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-6 lg:col-start-6 space-y-6 text-lead text-ink-soft">
          <p>
            AGP desing es un taller de diseño especializado en regalos con intención. Transformamos lo que más valoras —desde el automovilismo y la música hasta los aniversarios más significativos— en piezas tangibles de alta calidad que cuentan tu propia historia.
          </p>
          <p>
            Unimos empatía emocional con una manufactura impecable. Cuidamos rigurosamente cada detalle técnico: desde la distribución tipográfica y la réplica exacta de interfaces digitales, hasta el ensamblaje estructurado de elementos en miniatura para lograr un acabado perfecto.
          </p>
          <p className="font-display text-2xl text-ink italic">
            Si ves tu pasión en nuestro catálogo, escríbenos. Si quieres que diseñemos una nueva historia desde cero, también.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
