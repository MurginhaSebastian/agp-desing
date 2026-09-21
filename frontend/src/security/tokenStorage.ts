/**
 * Almacena el JWT en sessionStorage.
 * Decisión documentada en docs/plan-agp-design.md § Entregable 5:
 * se borra al cerrar la pestaña, y como el token va en el header (no en cookie)
 * no hay superficie CSRF. Si el día de mañana se permite HTML en descripciones,
 * migrar a cookie httpOnly.
 */
const KEY = 'agp.admin.token'
const EXP_KEY = 'agp.admin.exp'

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const tokenStorage = {
  get(): string | null {
    return safe(() => {
      const token = sessionStorage.getItem(KEY)
      const exp = sessionStorage.getItem(EXP_KEY)
      if (!token || !exp) return null
      if (Date.parse(exp) <= Date.now()) {
        tokenStorage.clear()
        return null
      }
      return token
    }, null)
  },
  set(token: string, expiresAt: string) {
    safe(() => {
      sessionStorage.setItem(KEY, token)
      sessionStorage.setItem(EXP_KEY, expiresAt)
    }, undefined)
  },
  clear() {
    safe(() => {
      sessionStorage.removeItem(KEY)
      sessionStorage.removeItem(EXP_KEY)
    }, undefined)
  },
}
