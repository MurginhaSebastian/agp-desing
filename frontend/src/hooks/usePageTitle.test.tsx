import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePageTitle } from '@/hooks/usePageTitle'

const POR_DEFECTO = 'AGP Desing - Regalos y decoración corporativa'

describe('usePageTitle', () => {
  afterEach(() => {
    cleanup()
    document.title = ''
  })

  it('pone el título y al salir restaura el de siempre', () => {
    const { unmount } = renderHook(() => usePageTitle('Cuadro Luna'))
    expect(document.title).toBe('Cuadro Luna')
    unmount()
    expect(document.title).toBe(POR_DEFECTO)
  })

  it('con null no toca nada, ni al entrar ni al salir', () => {
    document.title = 'previo'
    const { unmount } = renderHook(() => usePageTitle(null))
    expect(document.title).toBe('previo')
    unmount()
    expect(document.title).toBe('previo')
  })

  it('pasa de null al nombre cuando ya se conoce', () => {
    const { rerender } = renderHook(({ t }) => usePageTitle(t), { initialProps: { t: null as string | null } })
    rerender({ t: 'Obra' })
    expect(document.title).toBe('Obra')
  })

  it('cambia de título al cambiar el valor', () => {
    const { rerender } = renderHook(({ t }) => usePageTitle(t), { initialProps: { t: 'A' } })
    rerender({ t: 'B' })
    expect(document.title).toBe('B')
  })
})
