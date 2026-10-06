import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRecurso } from '@/hooks/useRecurso'

describe('useRecurso', () => {
  afterEach(() => {
    cleanup()
  })

  it('sin clave no pide nada y está listo', () => {
    const cargar = vi.fn()
    const { result } = renderHook(() => useRecurso(null, cargar))
    expect(result.current.estado).toBe('ok')
    expect(cargar).not.toHaveBeenCalled()
  })

  it('carga y luego da el dato', async () => {
    const { result } = renderHook(() => useRecurso('a', async (k) => `dato-${k}`))
    expect(result.current.estado).toBe('loading')
    await waitFor(() => expect(result.current.estado).toBe('ok'))
    expect(result.current.dato).toBe('dato-a')
  })

  it('si falla, no existe', async () => {
    const { result } = renderHook(() => useRecurso('a', () => Promise.reject(new Error('404'))))
    await waitFor(() => expect(result.current.estado).toBe('missing'))
  })

  it('con dato inicial lo enseña ya y, si el refresco falla, lo sigue enseñando', async () => {
    const cargar = vi.fn(() => Promise.reject(new Error('sin red')))
    const { result } = renderHook(() => useRecurso('a', cargar, 'traido'))
    expect(result.current).toEqual({ dato: 'traido', estado: 'ok' })
    await waitFor(() => expect(cargar).toHaveBeenCalledOnce())
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current).toEqual({ dato: 'traido', estado: 'ok' })
  })

  it('descarta la respuesta de una clave que ya no se pide', async () => {
    let soltarVieja: (v: string) => void = () => {}
    const cargar = (k: string) =>
      k === 'vieja' ? new Promise<string>((r) => (soltarVieja = r)) : Promise.resolve('nueva')
    const { result, rerender } = renderHook(({ clave }) => useRecurso(clave, cargar), { initialProps: { clave: 'vieja' } })
    rerender({ clave: 'otra' })
    await waitFor(() => expect(result.current.dato).toBe('nueva'))
    soltarVieja('vieja')
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current.dato).toBe('nueva')
  })
})
