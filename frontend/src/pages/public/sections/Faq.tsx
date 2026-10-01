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

/**
 * Preguntas frecuentes, todas a la vista. Las respuestas son de una o dos frases: esconderlas
 * detrás de un acordeón obligaba a abrir cinco cosas para leer cinco líneas. En una hoja de
 * papel con su pestaña, en dos columnas, con la pregunta en la tipografía de los títulos.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="container-x pt-10 pb-24 md:pb-32">
      <Reveal className="relative paspartu capa-2 px-6 pt-14 pb-12 sm:px-10 md:px-16 md:pt-20 md:pb-16">
        <p className="pestana absolute bottom-full left-6 sm:left-10 md:left-16">Preguntas frecuentes</p>

        <h2 id="faq-title" className="text-h2 max-w-[20ch]">
          Lo que suelen preguntar antes de escribir.
        </h2>

        {/* Lista y no <dl>: un título no puede ir dentro de un <dt>. */}
        <ul className="mt-12 md:mt-16 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {faqs.map((f) => (
            <li key={f.q} className="max-w-[46ch]">
              <h3 className="text-h3">{f.q}</h3>
              <p className="mt-3 text-ink-soft leading-relaxed">{f.a}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
