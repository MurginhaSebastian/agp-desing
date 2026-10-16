import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFotoReducida } from '@/hooks/useFotoReducida'

const ORIGINAL = 'https://abc.supabase.co/storage/v1/object/public/productos/9a2b1c9e-8d7a-4b6c-9e1f-0a2b3c4d5e6f.jpg'

describe('useFotoReducida', () => {
  it('pinta la copia y, si no carga, vuelve a la original', () => {
    const { result } = renderHook(() => useFotoReducida(ORIGINAL))
    expect(result.current.src).toBe(ORIGINAL.replace('.jpg', '.min.jpg'))

    act(() => result.current.alFallar())
    expect(result.current.src).toBe(ORIGINAL)

    // Otra tarjeta con la misma foto ya no pide la copia.
    expect(renderHook(() => useFotoReducida(ORIGINAL)).result.current.src).toBe(ORIGINAL)
  })

  it('una foto sin copia posible se pinta tal cual y un fallo no hace nada raro', () => {
    const { result } = renderHook(() => useFotoReducida('/images/obras/01.svg'))
    expect(result.current.src).toBe('/images/obras/01.svg')
    act(() => result.current.alFallar())
    expect(result.current.src).toBe('/images/obras/01.svg')
  })
})
