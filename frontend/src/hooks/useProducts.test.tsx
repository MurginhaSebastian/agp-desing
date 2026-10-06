import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product } from '@/types/product'

/*
 * `useProducts` guarda la última lista en el módulo para que, al volver al catálogo, se pinte al
 * instante. Cada prueba recarga el módulo (y el servicio falso) para empezar sin esa memoria.
 */
const list = vi.fn<() => Promise<Product[]>>()

vi.mock('@/services/productService', () => ({ productService: { list: () => list() } }))

async function hook() {
  vi.resetModules()
  return (await import('@/hooks/useProducts')).useProducts
}

const obra = (id: string) => ({ id, name: id }) as Product

describe('useProducts', () => {
  beforeEach(() => {
    list.mockReset()
  })
  // Sin `globals` de Vitest, Testing Library no desmonta solo entre pruebas.
  afterEach(() => {
    cleanup()
  })

  it('la primera vez carga y luego enseña la lista', async () => {
    list.mockResolvedValue([obra('a')])
    const useProducts = await hook()
    const { result } = renderHook(() => useProducts())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.products).toEqual([obra('a')])
    expect(result.current.error).toBeNull()
  })

  it('al volver pinta al instante la última lista y la refresca por detrás', async () => {
    list.mockResolvedValue([obra('a')])
    const useProducts = await hook()
    const primera = renderHook(() => useProducts())
    await waitFor(() => expect(primera.result.current.loading).toBe(false))
    primera.unmount()

    list.mockResolvedValue([obra('a'), obra('b')])
    const { result } = renderHook(() => useProducts())
    expect(result.current.loading).toBe(false)
    expect(result.current.products).toEqual([obra('a')])
    await waitFor(() => expect(result.current.products).toHaveLength(2))
  })

  it('si falla sin nada que enseñar, da el error', async () => {
    list.mockRejectedValue(new Error('sin red'))
    const useProducts = await hook()
    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('sin red')
    expect(result.current.products).toEqual([])
  })

  it('si falla al refrescar, se queda con la lista que ya había y no avisa', async () => {
    list.mockResolvedValue([obra('a')])
    const useProducts = await hook()
    const primera = renderHook(() => useProducts())
    await waitFor(() => expect(primera.result.current.loading).toBe(false))
    primera.unmount()

    list.mockRejectedValue(new Error('sin red'))
    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    await new Promise((r) => setTimeout(r, 0))
    expect(result.current.error).toBeNull()
    expect(result.current.products).toEqual([obra('a')])
  })
})
