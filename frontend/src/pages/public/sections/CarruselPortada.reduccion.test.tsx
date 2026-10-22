import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CarruselPortada } from '@/pages/public/sections/CarruselPortada'

/*
 * En archivo aparte: Motion lee `prefers-reduced-motion` una sola vez por módulo, así que
 * no se puede alternar dentro del archivo que prueba el caso normal.
 */
class Visible {
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('CarruselPortada con prefers-reduced-motion', () => {
  it('no pasa sola ni ofrece pausa, pero se maneja a mano', () => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', Visible)
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('prefers-reduced-motion'), media: q, onchange: null,
      addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
      dispatchEvent: () => false,
    }))
    render(<MemoryRouter><CarruselPortada fotos={['/a.svg', '/b.svg', '/c.svg']} cargando={false} /></MemoryRouter>)

    act(() => { vi.advanceTimersByTime(30000) })
    expect(screen.getByText(/\/ 03/).textContent).toBe('01 / 03')
    expect(screen.queryByRole('button', { name: /Pausar|Seguir pasando/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Foto siguiente' }))
    expect(screen.getByText(/\/ 03/).textContent).toBe('02 / 03')
  })
})
