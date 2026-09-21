import { Reveal } from '@/components/ui/Reveal'

export function About() {
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-nude">
      <div className="container-x section-y grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="label-brand">Sobre AGP Desing</p>
          <h2 id="sobre-title" className="text-h2 mt-4">
            Un taller pequeño. A propósito.
          </h2>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-6 lg:col-start-6 space-y-6 text-lead text-ink-soft">
          <p>
            AGP Desing es un estudio de pintura de una sola persona. Cada cuadro se hace a mano, en el orden en que llega el pedido, y no hay dos iguales aunque se parezcan.
          </p>
          <p>
            Trabajamos con óleo, acrílico y técnica mixta sobre lienzo o madera. Los formatos van desde una pieza pequeña para un escritorio hasta lienzos de metro y medio para una sala.
          </p>
          <p className="font-display text-2xl text-ink italic">
            Si te gusta algo del catálogo, escríbenos. Si no encuentras lo que buscas, también.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
