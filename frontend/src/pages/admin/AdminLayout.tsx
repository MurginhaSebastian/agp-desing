import { ExternalLink, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { useAuth } from '@/hooks/useAuth'

export function AdminLayout() {
  const { logout } = useAuth()
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-oat bg-silk">
        <div className="container-x h-16 flex items-center justify-between gap-6">
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
            <Link to="/" className="btn-ghost text-sm" target="_blank" rel="noopener noreferrer">
              Ver web <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <button type="button" onClick={logout} className="btn-ghost text-sm">
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" /> Salir
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
