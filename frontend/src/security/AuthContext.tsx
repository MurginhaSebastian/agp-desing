import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/servicios'
import { unauthorizedEvent } from '@/services/http'
import { tokenStorage } from '@/security/tokenStorage'
import type { LoginRequest } from '@/types/auth'

/** Lo que ve cualquier pantalla del panel. No se exporta: solo lo usa este archivo. */
interface AuthState {
  isAuthenticated: boolean
  login: (req: LoginRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => tokenStorage.get() !== null)
  /** Cambia en cada entrada: si se entra otra vez, el cierre se reprograma con la caducidad nueva. */
  const [sesion, setSesion] = useState(0)

  const login = useCallback(async (req: LoginRequest) => {
    const res = await authService.login(req)
    tokenStorage.set(res.token, res.expiresAt)
    setAuthenticated(true)
    setSesion((n) => n + 1)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setAuthenticated(false)
  }, [])

  /*
   * El token caduca con la página abierta: se cierra la sesión en ese momento, sin esperar a que
   * el backend lo rechace (en modo demo no lo rechazaría nunca). Además se vuelve a mirar al
   * volver a la pestaña, porque el navegador frena los temporizadores de las pestañas en segundo
   * plano y el aviso puede llegar tarde. `ProtectedRoute` lleva entonces al login.
   */
  useEffect(() => {
    if (!isAuthenticated) return
    const comprobar = () => {
      if (tokenStorage.get() === null) setAuthenticated(false)
    }
    const caduca = tokenStorage.caducidad()
    // setTimeout no admite más de ~24 días; una sesión dura horas, pero mejor no desbordar.
    const espera = caduca === null ? 0 : Math.min(Math.max(caduca - Date.now(), 0), 2 ** 31 - 1)
    const temporizador = setTimeout(comprobar, espera)
    document.addEventListener('visibilitychange', comprobar)
    return () => {
      clearTimeout(temporizador)
      document.removeEventListener('visibilitychange', comprobar)
    }
  }, [isAuthenticated, sesion])

  // El backend rechazó el token (expiró o fue revocado): cerrar sesión en la UI.
  useEffect(() => {
    const onUnauthorized = () => setAuthenticated(false)
    unauthorizedEvent.addEventListener('unauthorized', onUnauthorized)
    return () => unauthorizedEvent.removeEventListener('unauthorized', onUnauthorized)
  }, [])

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
