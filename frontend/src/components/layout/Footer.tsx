import { Link } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { Instagram, TikTok } from '@/components/ui/iconos'
import { REDES, SECCIONES } from '@/config/enlaces'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const ICONO_DE = { Instagram, TikTok }

/**
 * El pie es la trasera de la caja: bordeaux con grano, lo justo. Logotipo y lema, los enlaces en
 * una fila (con la fila, el rótulo «Navegar» sobraba) y debajo, la fila legal.
 */
export function Footer() {
  const year = new Date().getFullYear()
  const enlace = 'link-underline inline-flex items-center gap-2 min-h-11'
  return (
    <footer className="bg-bordeaux con-grano text-silk">
      <div className="container-x pt-14 pb-10 md:pt-20 md:pb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Wordmark onDark />
            <p className="mt-4 max-w-sm font-display text-xl text-silk/80">
              Detalles únicos, ensamblados a mano.
            </p>
          </div>

          <nav aria-label="Pie de página">
            <ul className="flex flex-wrap gap-x-7">
              {SECCIONES.filter((s) => s.enPie).map((s) => (
                <li key={s.to}><Link className={enlace} to={s.to}>{s.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-5 border-t border-silk/15 flex flex-wrap items-center gap-x-7">
          <p className="nota !text-silk/70 w-full sm:w-auto">Escríbenos</p>
          <ul className="flex flex-wrap gap-x-7">
            <li>
              <a className={enlace} href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            {REDES.map(({ nombre, url }) => {
              const Icono = ICONO_DE[nombre]
              return (
                <li key={nombre}>
                  <a className={enlace} href={url} target="_blank" rel="noopener noreferrer">
                    <Icono size={18} /> {nombre}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="rule-dark">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-silk/55">
          <p>© {year} AGP Desing. Regalos con intención y diseño estructurado.</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-6">
            <Link to="/privacidad" className="link-underline inline-flex items-center min-h-11">Privacidad</Link>
            <Link to="/terminos" className="link-underline inline-flex items-center min-h-11">Términos</Link>
            <Link to="/admin" className="link-underline inline-flex items-center min-h-11">Administrar</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
