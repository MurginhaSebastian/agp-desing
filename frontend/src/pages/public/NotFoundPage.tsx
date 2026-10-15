import { Link } from 'react-router-dom'
import { CajaVacia } from '@/components/ui/CajaVacia'
import { FlechaDerecha } from '@/components/ui/iconos'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSeo } from '@/hooks/useSeo'

/**
 * Dirección que no existe. Sin esta página, React Router enseña su pantalla
 * de error en inglés y el visitante se queda sin salida.
 */
export function NotFoundPage() {
  usePageTitle('Página no encontrada — AGP Desing')
  // Vercel responde 200 a cualquier dirección (la web es una sola página): sin el noindex,
  // Google guardaría las direcciones mal escritas como páginas de verdad.
  useSeo({ noindex: true })
  return (
    <CajaVacia
      titulo="Esta página no existe."
      texto="Puede que el enlace esté mal escrito o que la hayamos movido. El catálogo sigue donde siempre."
    >
      <Link to="/catalogo" className="boton">
        Ver el catálogo
        <FlechaDerecha size={18} />
      </Link>
      <Link to="/" className="enlace-flecha">
        Ir al inicio
      </Link>
    </CajaVacia>
  )
}
