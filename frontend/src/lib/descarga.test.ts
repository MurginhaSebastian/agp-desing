import { afterEach, describe, expect, it, vi } from 'vitest'
import { descargar } from '@/lib/descarga'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('descargar', () => {
  it('pulsa un enlace con el nombre dado, lo quita del DOM y suelta la dirección blob después', () => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:abc')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    descargar(new Blob(['a,b']), 'ventas.csv')

    const pulsado = click.mock.contexts[0] as HTMLAnchorElement
    expect(pulsado.download).toBe('ventas.csv')
    expect(pulsado.getAttribute('href')).toBe('blob:abc')
    expect(document.querySelector('a[download]')).toBeNull()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:abc')
  })
})
