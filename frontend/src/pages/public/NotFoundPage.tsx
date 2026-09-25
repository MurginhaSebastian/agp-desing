import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Dirección que no existe. Sin esta página, React Router enseña su pantalla
 * de error en inglés y el visitante se queda sin salida.
 */
export function NotFoundPage() {
  return (
    <div className="container-x py-24 md:py-32 max-w-xl">
      <p className="label-brand">404</p>
      <h1 className="text-h2 mt-4">Esta página no existe.</h1>
      <p className="mt-4 text-ink-soft">
        Puede que el enlace esté mal escrito o que la hayamos movido. El catálogo sigue donde siempre.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/catalogo" className="btn-primary">
          Ver el catálogo
          <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
        </Link>
        <Link to="/" className="btn-secondary">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
