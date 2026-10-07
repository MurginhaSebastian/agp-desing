import { ExternalLink, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Wordmark } from '@/components/layout/Wordmark'
import { contactosSinConfigurar, env } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'

/**
 * Aviso de contactos sin configurar. Los datos reales no viven en el código, así que es
 * perfectamente posible publicar con el WhatsApp y el correo de ejemplo y no enterarse:
 * la web funciona igual, solo que los botones llevan a un número que no existe.
 *
 * Una franja fina bajo la cabecera, no una tarjeta con sombra: tiene que verse al entrar
 * al panel y no competir con el contenido. Dice qué pasa y cómo se arregla, sin más.
 */
function AvisoContactos() {
  if (!contactosSinConfigurar) return null
  return (
    <div role="status" className="border-b border-brand/30 bg-nude">
      <p className="container-x py-3 text-sm text-ink leading-relaxed">
        La web está mostrando el WhatsApp <span className="tabular">{env.whatsappNumber}</span> y el correo{' '}
        <span className="tabular">{env.contactEmail}</span>, que son de ejemplo. Escribe los reales en{' '}
        <code className="text-ink-soft">frontend/.env</code> y vuelve a arrancar la web.
      </p>
    </div>
  )
}

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
              Productos
            </NavLink>
            <NavLink
              to="/admin/ventas"
              className={({ isActive }) => `btn-ghost text-sm ${isActive ? 'text-brand' : ''}`}
            >
              Ventas
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
      <AvisoContactos />
      <main className="container-x py-10 md:py-14 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
