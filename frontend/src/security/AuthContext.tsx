import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import { unauthorizedEvent } from '@/services/http'
import { tokenStorage } from '@/security/tokenStorage'
import type { LoginRequest } from '@/types/auth'

export interface AuthState {
  isAuthenticated: boolean
  login: (req: LoginRequest) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => tokenStorage.get() !== null)

  const login = useCallback(async (req: LoginRequest) => {
    const res = await authService.login(req)
    tokenStorage.set(res.token, res.expiresAt)
    setAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setAuthenticated(false)
  }, [])

  // El backend rechazó el token (expiró o fue revocado): cerrar sesión en la UI.
  useEffect(() => {
    const onUnauthorized = () => setAuthenticated(false)
    unauthorizedEvent.addEventListener('unauthorized', onUnauthorized)
    return () => unauthorizedEvent.removeEventListener('unauthorized', onUnauthorized)
  }, [])

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
