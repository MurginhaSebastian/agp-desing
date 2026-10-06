import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/hooks/useAuth'
import { AuthProvider } from '@/security/AuthContext'
import { tokenStorage } from '@/security/tokenStorage'

const conProveedor = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>
const dentroDe = (ms: number) => new Date(Date.now() + ms).toISOString()

describe('la sesión del panel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it('se cierra sola cuando caduca el token, aunque la página siga abierta', () => {
    tokenStorage.set('t', dentroDe(60_000))
    const { result } = renderHook(() => useAuth(), { wrapper: conProveedor })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      vi.advanceTimersByTime(59_000)
    })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(tokenStorage.get()).toBeNull()
  })

  it('al volver a la pestaña se comprueba (el navegador frena los temporizadores en segundo plano)', () => {
    tokenStorage.set('t', dentroDe(60_000))
    const { result } = renderHook(() => useAuth(), { wrapper: conProveedor })
    // El reloj avanza sin que el temporizador llegue a sonar, como en una pestaña dormida.
    vi.setSystemTime(Date.now() + 120_000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('al entrar se programa el cierre con la caducidad nueva', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: conProveedor })
    expect(result.current.isAuthenticated).toBe(false)
    // Modo demo: admin/demo entra con un token de 8 horas (tras 300 ms de espera simulada).
    await act(async () => {
      const entrando = result.current.login({ username: 'admin', password: 'demo' })
      await vi.advanceTimersByTimeAsync(300)
      await entrando
    })
    expect(result.current.isAuthenticated).toBe(true)
    act(() => {
      vi.advanceTimersByTime(8 * 3600 * 1000)
    })
    expect(result.current.isAuthenticated).toBe(false)
  })
})
