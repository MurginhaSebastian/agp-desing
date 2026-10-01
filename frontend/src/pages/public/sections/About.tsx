import { Reveal } from '@/components/ui/Reveal'

/**
 * La filosofía, en una hoja de paspartú con su pestaña. La frase final va en una tira de papel
 * que sobresale del borde de la hoja, como una nota prendida encima: es la capa de delante.
 */
export function About() {
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="container-x pt-10">
      <Reveal className="relative paspartu capa-2 px-6 pt-14 pb-12 sm:px-10 md:px-16 md:pt-20 md:pb-16">
        <p className="pestana absolute bottom-full left-6 sm:left-10 md:left-16">Sobre AGP Desing</p>

        <h2 id="sobre-title" className="text-h2 max-w-[17ch]">
          Hecho para quedarse con quien lo recibe.
        </h2>

        <div className="mt-10 md:mt-14 grid gap-8 md:grid-cols-2 md:gap-14 text-lead text-ink-soft">
          <p className="max-w-[46ch]">
            Cada cuadro o box se hace por encargo y para una sola persona; por eso no hay dos iguales. Partimos de una impresión a full color y la trabajamos a mano con los detalles que nos pides. En los cuadros 3D sumamos capas y objetos en miniatura: tienen relieve y profundidad, no son una foto enmarcada.
          </p>
          <p className="max-w-[46ch]">
            Aquí no hay carrito de compras. Eliges del catálogo o diseñamos desde cero, y coordinas cada pedido por WhatsApp directamente con nosotros. Trabajamos pensando en quien lo recibe: que al abrir el empaque quiera guardarlo para siempre y enseñarlo a los suyos.
          </p>
        </div>

        <p className="papel capa-2 relative mt-12 p-6 md:p-7 font-display text-[1.375rem] leading-snug text-ink md:ml-auto md:max-w-[25rem] md:translate-x-8 md:translate-y-12 lg:translate-x-12">
          Escríbenos y cuéntanos para quién es y qué ama; lo demás lo conversamos.
        </p>
      </Reveal>
    </section>
  )
}
