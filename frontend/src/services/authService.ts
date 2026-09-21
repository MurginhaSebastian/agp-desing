import { isDemoMode } from '@/config/env'
import { http } from '@/services/http'
import type { AuthResponse, LoginRequest } from '@/types/auth'

/**
 * Modo demo: cualquier usuario "admin" con clave "demo" entra.
 * Solo existe para ver el panel sin backend. En producción el backend
 * valida contra BCrypt y firma el JWT.
 */
const demo = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    await new Promise((r) => setTimeout(r, 300))
    if (req.username !== 'admin' || req.password !== 'demo') {
      throw new Error('Usuario o contraseña incorrectos')
    }
    return {
      token: 'demo-token',
      username: 'admin',
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    }
  },
}

const remote = {
  login: (req: LoginRequest) => http<AuthResponse>('/api/auth/login', { method: 'POST', body: req }),
}

export const authService = isDemoMode ? demo : remote
