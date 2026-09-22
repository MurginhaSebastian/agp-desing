import { ExternalLink, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { useAuth } from '@/hooks/useAuth'

export function AdminLayout() {
  const { logout } = useAuth()
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-oat bg-silk">
        {/* En móvil la cabecera envuelve en dos líneas: con cuatro acciones no cabe
            en 375px y el panel acababa con scroll horizontal. */}
        <div className="container-x min-h-16 py-2 sm:py-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex items-center gap-6">
            <Wordmark />
            <span className="label hidden sm:inline">Panel</span>
          </div>
          <nav aria-label="Administración" className="flex items-center gap-1 sm:gap-3">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `btn-ghost text-sm ${isActive ? 'text-brand' : ''}`}
            >
              Cuadros
            </NavLink>
            <NavLink
              to="/admin/portada"
              className={({ isActive }) => `btn-ghost text-sm ${isActive ? 'text-brand' : ''}`}
            >
              Portada
            </NavLink>
            <Link
              to="/"
              className="btn-ghost text-sm"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver la web en otra pestaña"
            >
              <span className="hidden sm:inline">Ver web</span>
              <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <button type="button" onClick={logout} className="btn-ghost text-sm" aria-label="Cerrar sesión">
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="container-x py-10 md:py-14 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
