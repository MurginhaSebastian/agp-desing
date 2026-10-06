import type { AuthGateway } from '@/services/contratos'

/**
 * Cualquiera que escriba "admin" y "demo" entra. Solo existe para ver el panel sin backend:
 * con backend, el servidor valida contra BCrypt y firma el JWT.
 */
export function crearSesionDemo(): AuthGateway {
  return {
    async login(req) {
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
}
