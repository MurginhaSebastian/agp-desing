import { Link } from 'react-router-dom'
import { FlechaDerecha, FlechaFuera } from '@/components/ui/iconos'
import { enlaceWhatsApp } from '@/lib/whatsapp'

interface Props {
  /** La otra página legal, para pasar de una a otra. */
  otra: { to: string; texto: string }
}

/** El cierre de las páginas legales: la otra página y el chat del negocio. */
export function PieLegal({ otra }: Props) {
  return (
    <div className="mt-14 pt-6 border-t border-oat flex flex-wrap items-center gap-x-8 gap-y-2">
      <Link to={otra.to} className="enlace-flecha">
        {otra.texto}
        <FlechaDerecha size={18} />
      </Link>
      <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className="enlace-flecha">
        Escríbenos
        <FlechaFuera size={18} />
      </a>
    </div>
  )
}
