import { ArrowUpRight } from 'lucide-react'
import { WhatsAppButton } from '@/components/catalog/WhatsAppButton'
import { Reveal } from '@/components/ui/Reveal'
import { env } from '@/config/env'

/**
 * Bloque de contacto sobre rojo de marca. Es el único momento en que el
 * rojo ocupa una superficie grande — por eso pega.
 */
export function Contact() {
  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-brand text-silk">
      <div className="container-x section-y grid gap-12 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-7">
          <p className="label text-rose">Contacto</p>
          <h2 id="contacto-title" className="text-h2 mt-4 text-silk">
            ¿Tienes una pared vacía? Cuéntanos de ella.
          </h2>
          <p className="text-lead mt-6 max-w-[40ch] text-silk/80">
            Escríbenos por WhatsApp con una foto del espacio o el nombre del cuadro que te gustó. Respondemos el mismo día.
          </p>
          <div className="mt-10">
            <WhatsAppButton variant="on-dark" />
          </div>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-4 lg:col-start-9">
          <p className="label text-rose mb-4">Síguenos</p>
          <ul className="border-t border-silk/25">
            <li className="border-b border-silk/25">
              <a
                href={env.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 font-display text-3xl text-silk group"
              >
                Instagram
                <ArrowUpRight
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </li>
            <li className="border-b border-silk/25">
              <a
                href={env.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-5 font-display text-3xl text-silk group"
              >
                TikTok
                <ArrowUpRight
                  size={24}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="transition-transform duration-200 [transition-timing-function:var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
