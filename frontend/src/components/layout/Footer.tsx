import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { env } from '@/config/env'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

function InstagramIcon({ size = 20 }: { size?: number }) {
  // Lucide ya no incluye iconos de marca; glifo propio con el mismo trazo 1.75
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  // Lucide no trae TikTok; glifo mínimo con el mismo trazo 1.75
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-bordeaux text-silk">
      <div className="container-x py-14 md:py-20 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Wordmark onDark />
          <p className="mt-5 max-w-sm text-silk/75 text-[0.9375rem]">
            Cuadros pintados a mano, uno a la vez. Sin catálogo infinito ni carrito: miras, preguntas, y lo pintamos para tu pared.
          </p>
        </div>

        <nav aria-label="Pie de página" className="md:col-span-3 md:col-start-7">
          <p className="label text-silk/60 mb-4">Navegar</p>
          <ul className="space-y-2.5">
            <li><Link className="link-underline" to="/#sobre">Sobre AGP</Link></li>
            <li><Link className="link-underline" to="/#como-funciona">Cómo funciona</Link></li>
            <li><Link className="link-underline" to="/catalogo">Catálogo</Link></li>
            <li><Link className="link-underline" to="/#faq">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        <div className="md:col-span-3">
          <p className="label text-silk/60 mb-4">Escríbenos</p>
          <ul className="space-y-2.5">
            <li>
              <a className="link-underline" href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 link-underline" href={env.instagramUrl} target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={18} /> Instagram
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 link-underline" href={env.tiktokUrl} target="_blank" rel="noopener noreferrer">
                <TikTokIcon size={18} /> TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="rule-dark">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-silk/55">
          <p>© {year} AGP desing. Regalos con intención y diseño estructurado.</p>
          <Link to="/admin" className="link-underline">Administrar</Link>
        </div>
      </div>
    </footer>
  )
}
