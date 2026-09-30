import { Reveal } from '@/components/ui/Reveal'

export function About() {
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-nude">
      <div className="container-x section-y grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="label-brand">Sobre AGP Desing</p>
          <h2 id="sobre-title" className="text-h2 mt-4">
            Hecho para quedarse con quien lo recibe.
          </h2>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-6 lg:col-start-6 space-y-6 text-lead text-ink-soft">
          <p>
            Cada cuadro o box se hace por encargo y para una sola persona; por eso no hay dos iguales. Partimos de una impresión a full color y la trabajamos a mano con los detalles que nos pides. En los cuadros 3D sumamos capas y objetos en miniatura: tienen relieve y profundidad, no son una foto enmarcada.
          </p>
          <p>
            Aquí no hay carrito de compras. Eliges del catálogo o diseñamos desde cero, y coordinas cada pedido por WhatsApp directamente con nosotros. Trabajamos pensando en quien lo recibe: que al abrir el empaque quiera guardarlo para siempre y enseñarlo a los suyos.
          </p>
          <p className="font-display text-2xl text-ink italic">
            Escríbenos y cuéntanos para quién es y qué ama; lo demás lo conversamos.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
