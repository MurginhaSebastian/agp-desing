import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { AuthContext } from '@/security/AuthContext'

describe('useAuth', () => {
  afterEach(() => cleanup())

  it('fuera de <AuthProvider> lanza un error claro', () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow('useAuth debe usarse dentro de <AuthProvider>')
    silencio.mockRestore()
  })

  it('dentro del proveedor devuelve el estado del contexto', () => {
    const estado = { isAuthenticated: true } as never
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={estado}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBe(estado)
  })
})
