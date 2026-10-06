import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { paraVolverA } from '@/lib/navegacion'

/**
 * Guard de /admin/*. Mejora la experiencia: evita mostrar un panel vacío.
 * La autorización que cuenta es la del backend (hasRole ADMIN); quien salte
 * este guard editando el bundle solo va a recibir 401.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={paraVolverA(location.pathname)} />
  }
  return <Outlet />
}
