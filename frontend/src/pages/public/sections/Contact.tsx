import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { FlechaFuera } from '@/components/ui/iconos'
import { Reveal } from '@/components/ui/Reveal'
import { env } from '@/config/env'

/**
 * Contacto: la hoja roja, montada sobre el papel con la sombra más honda de la página. Ya no es
 * una banda a sangre: así el pie bordeaux que viene después se lee como la trasera de la caja,
 * y no como dos bloques oscuros seguidos.
 */
export function Contact() {
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="container-x pt-10 pb-28 md:pb-36">
      <Reveal className="relative bg-brand con-grano radio-papel capa-3 text-silk px-6 pt-14 pb-12 sm:px-10 md:px-16 md:pt-20 md:pb-16">
        <p className="pestana absolute bottom-full left-6 sm:left-10 md:left-16 !text-silk">Contacto</p>

        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2 id="contacto-title" className="text-h2 text-silk max-w-[18ch]">
              ¿Listo para materializar esa historia? Cuéntanosla.
            </h2>
            <p className="text-lead mt-6 max-w-[42ch] text-silk/85">
              Escríbenos por WhatsApp con los detalles de tu idea, la pasión que quieres homenajear o el producto de nuestro catálogo que te interesó. Respondemos el mismo día para empezar a estructurar tu diseño.
            </p>
            <div className="mt-10">
              <WhatsAppButton variant="on-dark" />
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <p className="nota !text-silk/80 mb-3">Síguenos</p>
            <ul className="border-t border-silk/25">
              {[
                { nombre: 'Instagram', url: env.instagramUrl },
                { nombre: 'TikTok', url: env.tiktokUrl },
              ].map((red) => (
                <li key={red.nombre} className="border-b border-silk/25">
                  <a
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between min-h-11 py-4 font-display text-3xl text-silk"
                  >
                    {red.nombre}
                    <FlechaFuera
                      size={24}
                      className="transition-transform duration-200 [transition-timing-function:var(--ease-out)] motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
